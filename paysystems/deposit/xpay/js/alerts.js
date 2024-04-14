/**
 * Dialog popup with information messages
 */

function alerts(title, text, type, obj, image = null) {

    title = title || dictionary.get('message');
    text = text || '';
    obj = obj || '';
    type = (typeof type === 'undefined') ? '' : parseInt(type);

    var wrapClass = 'alerts-wrap';
    if (obj && obj['wrapClass']) {
        wrapClass += ' ' + obj['wrapClass']
    }

    if (type === 8) {

    } else {
        text = '<div class="' + wrapClass + '">' +
            (image !== null ? '<div class="alerts-image"><img src="' + image + '" alt=""></div>' : '') +
            '<div class="alerts-title">' + title + '</div><div class="alerts-text">' + text + '</div>' +
            '</div>';
    }

    if (obj && obj['link'] !== undefined) {
        text += '<a class="alerts-ok" href="' + obj['link'] + '" target="_blank">' + dictionary.get('go') + '</a>';
    }

    if (type === 3) {
        text += '<button class="alerts-ok">' + dictionary.get('ok') + '</button>';
        text += '<button class="alerts-cancel" onclick="closeForm()">' + dictionary.get('cancel') + '</button>';
    } else if (type === 6) {
        text += '<button class="alerts-ok" onclick="' + obj['functions']['ok'] + '">' + obj['buttons']['ok'] + '<span class="timer-reload requests_output-js" id="alertOkTimer" style="color: darkgreen; margin-left: 7px"></span>' + '</button>';
        text += '<button class="alerts-cancel" onclick="' + obj['functions']['cancel'] + '">' + obj['buttons']['cancel'] + '<span class="timer-reload requests_output-js" style="color: grey; margin-left: 7px"></span>' + '</button>';
    } else {
        const showClose = obj && obj['link'] !== undefined;
        if (showClose) {
            const cancelText = obj['buttons'] !== undefined && obj['buttons']['cancel'] !== undefined ? obj['buttons']['cancel'] : dictionary.get('cancel');
            text += '<button class="alerts-cancel" onclick="closeForm()">' + cancelText + '</button>';
        } else {
            const okText = (obj['buttons'] !== undefined && obj['buttons']['ok'] !== undefined) ? obj['buttons']['ok'] : dictionary.get('ok');
            text += '<button class="alerts-ok" onclick="closeForm()">' + okText + '</button>';
        }
    }

    initFormContainer();

    if (!payment_form.hasClass('active')) {
        $(".fon_modal").toggleClass('active');
        payment_form.toggleClass('active').show();
    }
    payment_form.closest(".payment_modal_wrapper").addClass('active');

    payment_form_container.html(text);
    paymentMethodsWrap.addClass('payment-methods__wrap--hidden');

    if (type === 3) {
        payment_form_container.find('.alerts-ok').on('click', function() {
            obj();
        });
    }

    if (isReloadingWithKeyActive('cancelLockExpiration') && findFirstCancelButton()) {
        disableUpdateButton('.alerts-cancel');
        createTimerReload('cancelLockExpiration', '.alerts-cancel')
    }

    getOffsetForm(payment_form);
    scrollToFormIfNeeded();
}