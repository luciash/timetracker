(function($){
    var STORAGE_KEY = 'tikitimetracker';
    var data = JSON.parse( window.localStorage[STORAGE_KEY] || '{}' );

    function saveData() {
        window.localStorage[STORAGE_KEY] = JSON.stringify(data);
    }

    $.fn.timetracker = function(  ) {
        var $tracker = $(this);
        var $display = $tracker.find('[role=render-area]');
        var $tplEl = $tracker.find('script[role=template]');
        var template = Handlebars.compile($tplEl.html());

        data.entry = data.entry || {};
        data.timer = data.timer || 'stopped'; // 'running', 'paused', 'stopped'

        function showEntries() {
            var html = template({'entries': (data.entries||[]) });
            $display.html(html);
        }

        function updateTimer(value) {
            var oldval = data.timer;
            data.timer = value;
            $tracker.trigger('timer_update', [oldval, value]);
            saveData();
            return value;
        }

        function updateEntry(prop, value) {
            var oldval = data.entry[prop];
            data.entry[prop] = value;
            $tracker.trigger('entry_update', [prop, oldval, value]);
            saveData();
            return {prop, value};
        }

        function saveEntry(entry) {
            data.entry = {};
            data.entries && data.entries.push(entry) || (data.entries=[entry]);
            $tracker.find(':input[bind]').val('').keyup();
            showEntries();
        }

        function transform(prop, value) {
            var chain = {
                'spenttime': [
                    (int) => moment.utc(int * 1000).format('HH:mm:ss')
                ]
            }
            if (!chain[prop]) {
                return value;
            }
            return chain[prop].reduce((v,f) => f(v), value);
        }

        $tracker.on('entry_update', function(evt, prop, oldval, value) {
            // TODO: cache selectors
            $tracker.find('[bind='+prop+']').each(function(){
                $(this).is(':input')
                    ? $(this).val(transform(prop, value))
                    : $(this).text(transform(prop, value));
            });
        });

        $tracker.find('[bind]')
            .each(function(){
                var attr = $(this).attr('bind');
                var value = data.entry[attr];
                if ( value ) {
                    $(this).is(':input')
                        ? $(this).val(value)
                        : $(this).text(value);
                }
            })
            .filter(':input')
            .keyup(function(){
                var attr = $(this).attr('bind');
                updateEntry(attr, $(this).val());
            });

        $tracker.find('button[timer]').click(function(){
            var action = $(this).attr('timer');
            
            switch (action) {
                case 'play':
                    data.entry.date || updateEntry('date', moment().format('DD/MM/YYYY'))
                    data.entry.starttime || updateEntry('starttime', moment().format('HH:mm:ss'))
                    updateTimer('running');
                    break;
                case 'pause':
                    updateTimer('paused');
                    break;
                case 'save':
                    saveEntry(data.entry);
                    updateTimer('stopped');
                    break;
            }
        });

        setInterval(function tick(){
            if ( data.timer === 'running' ) {
                var spenttime = parseInt(data.entry['spenttime'], 10) || 0;
                updateEntry('spenttime', spenttime + 1);
            }

            if ( data.timer === 'running' || data.timer === 'paused' ) {
                updateEntry('endtime',  moment().format('HH:mm:ss'));
            }
        }, 1000);

        showEntries();
    }
    
    $(function(){
        $(document.body).timetracker();
    });

})(jQuery)
