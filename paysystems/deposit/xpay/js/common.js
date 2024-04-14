// Create IE + others compatible event handler
var event_method = window.addEventListener ? 'addEventListener' : 'attachEvent',
    eventHandler = window[event_method],
    message_event = event_method === 'attachEvent' ? 'onmessage' : 'message',
    scrollHelper = {
        current_height: null,
        force_current_height: null
    };

// Listen to message from child window
eventHandler(message_event, function(e) {
    if (e.origin !== document.location.origin) {
        return;
    }

    if (typeof e.data.ga !== 'undefined') {
        localStorage.setItem('ga', JSON.stringify(e.data.ga));
    }
}, false);

function getAnalyticsParams() {
    var data = {
        ga: true
    };
    parent.postMessage(data, document.location);
}

document.addEventListener('DOMContentLoaded', function() {
    resize();

    if (window.location.pathname.indexOf('onpay') !== -1 && window.location.pathname.indexOf('paysystems') === -1) {
        $('form input[type="submit"]').on('click', function(e) {
            e.preventDefault();
            sendAnalyticsData('Пополнить игровой счет (депозит)', 'Клик подтвердить');
            //send_ya_to_parent_window('podtverdit-popolnenie');
            $('form').submit();
        });
    }
});

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] === variable) {
            return pair[1];
        }
    }
    return false;
}

function resize() {

    let bottomPadding = window.user_refid === 178 ? 0 : 50;

    var actual_height = scrollHelper.current_height ? scrollHelper.current_height : document.getElementsByTagName('body')[0].children[0].scrollHeight + bottomPadding,
        frame;

    if (isInFrame()) {
        frame = parent.document.getElementById('payments_frame');
        frame.style.height = (actual_height) + 'px';

        if (!frame.style.minHeight) {
            frame.style.minHeight = '400px';
        }
    }
}

// проверка на отображение в фрейме
function isInFrame() {
    if (typeof parent.document.getElementById('payments_frame') !== 'undefined' && parent.document.getElementById('payments_frame')) {
        return true;
    }
    return false;
}