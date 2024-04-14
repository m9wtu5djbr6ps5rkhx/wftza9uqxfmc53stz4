modules.crypto.metamask = {};

$(function() {
    var browserName = detectBrowser(),
        metamaskAccountId = null;

    function detectBrowser() {
        if (navigator.userAgent.match(/chrome|chromium|crios/i)) {
            return "chrome";
        } else if (navigator.userAgent.match(/firefox|fxios/i)) {
            return "firefox";
        } else if (navigator.userAgent.match(/safari/i)) {
            return "safari";
        } else if (navigator.userAgent.match(/opr\//i)) {
            return "opera";
        } else if (navigator.userAgent.match(/edg/i)) {
            return "edge";
        } else {
            return null;
        }
    }

    function closeMetamaskInstallModal() {
        var modal = document.getElementById('metamask_install_modal');
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
            $('.payment-systems-modal-bg').removeClass('active');
        }
    }

    function toggleMetamaskPayments() {
        var metamaskBtn = $('.metamask_btn');
        metamaskBtn.toggleClass('active');
        $('#group_crypto_currency .payment_item:not([data-metamask="1"])').toggle();

        if (metamaskBtn.hasClass('active')) {
            modules.crypto.metamask.isActive = true;
        } else {
            modules.crypto.metamask.isActive = false;
        }

        resize();
    }

    function getWallet() {
        return new Promise((resolve, reject) => {
            if (typeof window.ethereum !== 'undefined') {
                const web3 = new Web3(window.ethereum);
                window.ethereum.enable().then(function() {
                    web3.eth.getAccounts().then(function(accounts) {
                        // Выводим номер первого кошелька
                        const walletAddress = accounts[0];
                        resolve(walletAddress);
                    });
                }).catch(function(error) {
                    reject(new Error(error));
                });
            } else {
                reject(new Error("MetaMask не найден"));
            }
        });
    }

    $(document).on('click', '.metamask_btn', async function(event) {
        event.preventDefault();
        if (metamaskAccountId !== null) {
            toggleMetamaskPayments();
            return;
        }

        if (typeof window.ethereum === 'undefined') {
            // у юзера нет расширения
            $('#metamask_install_modal').toggleClass('active');
            $('.payment-systems-modal-bg').toggleClass('active');

            return;
        }

        try {
            var accountIds = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
        } catch (e) {
            handleMetamaskAuthException(e);
        }
        // В текущий момент metamask возвращает только 1 акк
        metamaskAccountId = accountIds[0];

        if (metamaskAccountId !== null) {
            toggleMetamaskPayments();
        }

        modules.crypto.metamask.wallet = null;
        // только для выводов
        if (modules.main.type_operation === TYPE_WITHDRAW) {
            getWallet()
                .then((value) => {
                    modules.crypto.metamask.wallet = value;
                })
                .catch((err) => {
                    modules.crypto.metamask.wallet = null;
                    console.error(err);
                });
        }
    });

    $(document).on('click', '#metamask_install_modal_btn_install', function(event) {
        event.preventDefault();
        var link = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';
        switch (browserName) {
            case 'firefox':
                link = 'https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/';
                break;
            case 'edge':
                link = 'https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm?hl=en-US';
                break;
            case 'opera':
                link = 'https://addons.opera.com/en-gb/extensions/details/metamask-10/';
                break;
        }

        window.open(link, "_blank");
    });

    function startListenPaymentSystemClick() {
        var paymentSystems = $('.payment-system');
        if (paymentSystems.length === 0) {
            return;
        }

        for (var i = 0; i < paymentSystems.length; i++) {
            if (!paymentSystems[i].id) {
                console.error('No id for payment system button');
            }
            var modal = $('.payment-system-modal[data-for="' + paymentSystems[i].id + '"]');
            if (!modal) {
                console.error('No data-for for payment modal');
            }
            // перемещаем элемент, что бы он мог корректно отобразиться
            var newModal = modal.clone();
            modal.remove();
            $('body').append(newModal);
            newModal.find('.modal_btn_close').click(function() {
                $('.payment-systems-modal-bg').removeClass('active');
                $('.payment-system-modal').removeClass('active');
            });
            newModal.find('.payment_modal_btn#deposit').click(makeMetamaskDeposit);

            newModal.find('[name="amount"]').on('change', function() {
                $('#metamask_payment_deposit .error-content').removeClass('active');
            });
        }

        paymentSystems.click(async function() {
            if (metamaskAccountId !== null) {
                $('.payment-systems-modal-bg').addClass('active');

                let metamaskModal = $('.payment-system-modal[data-for="' + this.id + '"]');

                // при показе метамаска, делать скролл наверх, чтобы не было проблем (с позиционированием модального окна относительно модального окна метамаска)
                $('body,html').animate({
                    scrollTop: 0
                }, 0, function() {
                    moveModal(metamaskModal, payment_form);
                });

                metamaskModal.addClass('active');

                return;
            }

            if (typeof window.ethereum === 'undefined') {
                // у юзера нет расширения
                $('#metamask_install_modal').toggleClass('active');
                $('.payment-systems-modal-bg').toggleClass('active');

                return;
            }

            try {
                var accountIds = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
            } catch (e) {
                showMetamaskSnakeModal(this, e.code)

                return;
            }
            if (accountIds.length !== 0) {
                metamaskAccountId = accountIds[0];
            }

            $('.payment-systems-modal-bg').addClass('active');

            let metamaskModal = $('.payment-system-modal[data-for="' + this.id + '"]');

            // при показе метамаска, делать скролл наверх, чтобы не было проблем (с позиционированием модального окна относительно модального окна метамаска)
            $('body,html').animate({
                scrollTop: 0
            }, 0, function() {
                moveModal(metamaskModal, payment_form);
            });

            metamaskModal.addClass('active');
        });

        $('.payment-systems-modal-bg').click(function() {
            $('.payment-systems-modal-bg').removeClass('active');
            $('.payment-system-modal').removeClass('active');
        });
    }

    async function addMetamaskChain(chain) {
        try {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [chain],
            });
        } catch (e) {
            return handleMetamaskPaymentException(e);
        }

        return true;
    }

    async function switchMetamaskChain(chainId) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{
                    chainId,
                }],
            });
        } catch (e) {
            return handleMetamaskPaymentException(e);
        }

        return true;
    }

    async function addToken(tokenOptions, type) {
        try {
            return await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type,
                    options: tokenOptions,
                },
            });
        } catch (e) {
            return handleMetamaskPaymentException(e);
        }
    }

    async function makeMetamaskDeposit(e) {
        e.preventDefault();
        $(this).prop('disabled', true);
        var amount = $('#metamask_payment_deposit [name="amount"]').val();
        amount = amount.replace(',', '.');
        var minAmount = $('#metamask_payment_deposit [name="minAmount"]').val();
        if (amount === '' || parseFloat(minAmount) > parseFloat(amount)) {
            $(this).prop('disabled', false);
            showInputError('invalidSum');
            return;
        }
        var accountTo = $('#metamask_payment_deposit [name="address"]').val();
        var chain = JSON.parse($('#metamask_payment_deposit [name="chain"]').val());
        var tokenOptions = JSON.parse($('#metamask_payment_deposit [name="tokenOptions"]').val());
        var type = $('#metamask_payment_deposit [name="erc"]').val();
        var isDefault = JSON.parse($('#metamask_payment_deposit [name="default"]').val());

        var currentChain = await window.ethereum.request({
            method: 'eth_chainId'
        });
        if (chain['chainId'] !== currentChain) {
            if (!(await addMetamaskChain(chain))) {
                return;
            }

            if (!(await switchMetamaskChain(chain.chainId))) {
                return;
            }
        }

        var transactionParameters = isDefault ?
            createMetamaskParametersDefaultCurrency(accountTo, amount, tokenOptions) :
            await createMetamaskParametersNotDefaultCurrency(tokenOptions, accountTo, amount, type);

        if (!transactionParameters) {
            $('.payment-systems-modal-bg').removeClass('active');
            $('.payment-system-modal').removeClass('active');
            closeForm();

            alerts(getMetamaskRejectedTitle(), getMetamaskRejectedMessage(), undefined, {
                wrapClass: 'metamask-result-modal',
            }, './xpay/images/MetaMask_Fox.svg');

            return;
        }

        try {
            await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });
            $(this).prop('disabled', false);

            $('.payment-systems-modal-bg').removeClass('active');
            $('.payment-system-modal').removeClass('active');

            closeForm();

            alerts(getMetamaskSuccessTitle(), getMetamaskSuccessMessage(), undefined, {
                wrapClass: 'metamask-result-modal',
            }, '/xpay/images/MetaMask_Fox.svg');
        } catch (e) {
            $(this).prop('disabled', false);
            if (e.message === undefined) {
                throw e;
            }

            $('.payment-systems-modal-bg').removeClass('active');
            $('.payment-system-modal').removeClass('active');
            closeForm();

            alerts(getMetamaskRejectedTitle(), getMetamaskRejectedMessage(), undefined, {
                wrapClass: 'metamask-result-modal',
            }, './xpay/images/MetaMask_Fox.svg');
        }
    }

    function createMetamaskParametersDefaultCurrency(accountTo, amount, tokenOptions) {
        var web3 = new Web3(window.ethereum);
        return transactionParameters = {
            to: accountTo,
            from: window.ethereum.selectedAddress,
            value: web3.utils.toHex(web3.utils.toWei(amount.toString(), getUnitByMultiplierLen(parseInt(tokenOptions['decimals'])))),
            gas: tokenOptions['gasLimit'] ? '0x' + (parseInt(tokenOptions['gasLimit'])).toString(16) : undefined,
        };
    }

    async function createMetamaskParametersNotDefaultCurrency(tokenOptions, accountTo, amount, type) {
        if (!await addToken(tokenOptions, type)) {
            return false;
        }

        var web3 = new Web3(window.ethereum);

        var daiABI = [{
            constant: false,
            inputs: [{
                    name: "_to",
                    type: "address",
                },
                {
                    name: "_value",
                    type: "uint256",
                },
            ],
            name: "transfer",
            payable: false,
            stateMutability: "nonpayable",
            type: "function",
        }];

        var daiContract = new web3.eth.Contract(daiABI, tokenOptions['address']);

        var daiAmount;
        var unit = getUnitByMultiplierLen(parseInt(tokenOptions['decimals']));
        // если web3 ничего не знает про такую валюту и множитель
        if (unit === null) {
            var main = null;
            var cents = '';
            if (amount.includes('.')) {
                var split = amount.split('.');
                main = split[0];
                if (main === '') {
                    main = '0';
                }
                cents = split[1];
            }
            if (main === null) {
                main = amount;
            }

            while (cents.length < parseInt(tokenOptions['decimals'])) {
                cents += '0';
            }
            daiAmount = '0x' + Number(main + cents).toString(16)
        } else {
            daiAmount = web3.utils.toHex(web3.utils.toWei(amount.toString(), unit));
        }

        return {
            from: window.ethereum.selectedAddress,
            to: tokenOptions['address'],
            data: daiContract.methods.transfer(accountTo, daiAmount).encodeABI(),
            gas: tokenOptions['gasLimit'] ? '0x' + (parseInt(tokenOptions['gasLimit'])).toString(16) : undefined,
        };
    }

    function getUnitByMultiplierLen(multiplierLen) {
        switch (multiplierLen) {
            case 0:
                return 'wei';
            case 3:
                return 'kwei';
            case 6:
                return 'mwei';
            case 9:
                return 'gwei';
            case 12:
                return 'szabo';
            case 15:
                return 'finney';
            case 18:
                return 'ether';
            case 21:
                return 'kether';
            case 24:
                return 'mether';
            case 27:
                return 'gether';
            case 30:
                return 'tether';
            default:
                return null;
        }
    }

    // Было принято решение игнорировать эти ошибки на выдаче доступа к метамаск
    function handleMetamaskAuthException(e) {
        if (!showMetamaskSnake(e.code)) {
            throw e;
        }
    }

    function handleMetamaskPaymentException(e) {
        if (e.code === undefined) {
            throw e;
        }

        if (e.code === 4001) {
            $('.payment-systems-modal-bg').removeClass('active');
            $('.payment-system-modal').removeClass('active');
            closeForm();

            alerts(getMetamaskRejectedTitle(), getMetamaskRejectedMessage(), undefined, {
                wrapClass: 'metamask-result-modal',
            }, './xpay/images/MetaMask_Fox.svg');

            return false;
        }

        throw e;
    }

    function getMetamaskSuccessMessage() {
        return $('#metamask-deposit-success-text').val();
    }

    function getMetamaskSuccessTitle() {
        return $('#metamask-deposit-success-text').data('title');
    }

    function getMetamaskRejectedMessage() {
        return $('#metamask-deposit-rejected-text').val();
    }

    function getMetamaskRejectedTitle() {
        return $('#metamask-deposit-rejected-text').data('title');
    }

    function showInputError(error) {
        var text = $('#metamask_payment_deposit [name="' + error + '"]').data('errorText');
        $('#metamask_payment_deposit .error-content').html(text).addClass('active');
    }

    function showMetamaskSnake(errorId) {
        var errorInput = $('.metamask-snake .error-message[data-error-id="' + errorId + '"]');
        if (!errorInput) {
            return false;
        }

        $('.metamask-snake #metamask-snake-text').html(errorInput.val());
        $('.metamask-snake').show('fade', null, 300);
        if (snakeTimeout) {
            clearTimeout(snakeTimeout);
        }
        snakeTimeout = setTimeout(hideMetamaskSnake, 3000);
    }

    function showMetamaskSnakeModal(button, errorId) {
        var errorInput = $('.metamask-snake .error-message[data-error-id="' + errorId + '"]');

        if (!errorInput) {
            return false;
        }

        const snake = $('#metamask .metamask-snake');
        $('#metamask .metamask-snake .metamask-snake-text').html(errorInput.val());

        snake.show('fade', null, 300);

        if (snakeTimeout) {
            clearTimeout(snakeTimeout);
        }

        snakeTimeout = setTimeout(function() {
            if (snakeTimeout) {
                clearTimeout(snakeTimeout);
            }
            snake.hide('fade', null, 300);
        }, 3000);
    }

    function hideMetamaskSnake() {
        if (snakeTimeout) {
            clearTimeout(snakeTimeout);
        }
        $('.metamask-snake').hide('fade', null, 300);
    }

    var snakeTimeout = null;
    $(document).on('click', '.metamask_install_modal_btn_close', closeMetamaskInstallModal);
    $(document).on('click', '.payment-systems-modal-bg', closeMetamaskInstallModal);
    $(document).on('deposit.result_rendered', null, startListenPaymentSystemClick);
    $(document).on('operation.form_closed', null, function() {
        $('.payment-system-modal').remove();
        closeMetamaskInstallModal();
    });

    /**
     * @param modal - модалка открытая относительно основной
     * @param modalParent - основная модалка
     */
    function moveModal(modal, modalParent) {
        if (modalParent.height() > modal.height()) {
            modal.css({
                'top': ((modalParent.offset().top + modalParent.height() / 2) - (modal.height() / 2)) + 'px'
            });
        } else {
            modal.css({
                'top': modalParent.offset().top + 'px'
            });
        }
    }

    /**
     * Привязываем модальное окно метамаска к основному открытому модальному окну. (Для фреймы окно метамска может выходить за границы видимости фрейма)
     * Также перемещение модального окна при resize, скролле
     */
    $(document).on('modal:offsetForm', function(event, modal) {
        var metamaskModal = $('.payment-system-modal');
        if (modal.hasClass('active')) {
            moveModal(metamaskModal, modal);
        }
    });

    $('.metamask-snake .close_btn').on('click', hideMetamaskSnake);

    var coinSwitchers = {

        initMetamask: function() {
            modules.crypto.metamask.wallet = null;
            modules.crypto.metamask.isActive = false;
            $(document).on('click', '.metamask-switcher_btn', async function(event) {
                event.preventDefault();
                if (metamaskAccountId !== null) {
                    toggleMetamaskPayments(this);
                    return;
                }

                if (typeof window.ethereum === 'undefined') {
                    // у юзера нет расширения
                    $('#metamask_install_modal').toggleClass('active');
                    $('.payment-systems-modal-bg').toggleClass('active');

                    return;
                }

                try {
                    var accountIds = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });
                } catch (e) {
                    handleMetamaskAuthException(e);
                }
                // В текущий момент metamask возвращает только 1 акк
                metamaskAccountId = accountIds[0];

                if (metamaskAccountId !== null) {
                    toggleMetamaskPayments(this);
                }

                modules.crypto.metamask.wallet = null;
                // только для выводов
                if (modules.main.type_operation === TYPE_WITHDRAW) {
                    getWallet()
                        .then((value) => {
                            modules.crypto.metamask.wallet = value;
                        })
                        .catch((err) => {
                            modules.crypto.metamask.wallet = null;
                            console.error(err);
                        });
                }
            });

            function toggleMetamaskPayments(button) {
                let switchInput = $(button).find('input');
                switchInput.prop('checked', !switchInput.is(':checked'));

                let method;
                if (switchInput.is(':checked')) {
                    $(button).addClass('active');
                    method = 'hide';
                    modules.crypto.metamask.isActive = true;
                } else {
                    $(button).removeClass('active');
                    method = 'show';
                    modules.crypto.metamask.isActive = false;
                }

                let subBlockToggle = function(item, duration = 'fast') {
                    let showPaymentCellCount = item.find('.payment_item').filter((index, itemElement) => itemElement.style.display !== "none").length;
                    (showPaymentCellCount === 0) ? item.hide(duration): item.show(duration);
                }

                /**
                 * Внутри группы ищем методы с интеграцией метамаска
                 * @param sectionGroups - группа методов
                 * @param action - действие (скрыть/показать)
                 */
                let toggle = function(sectionGroups, action) {
                    sectionGroups.each(function(index, item) {
                        const items = $(item).find('.payment_item:not([data-metamask="1"])');
                        items[action]();
                        subBlockToggle($(item));
                    });
                }

                const sectionGroups = $('section.group_item');

                toggle(sectionGroups, method);
                resize();
            }

            function getWallet() {
                return new Promise((resolve, reject) => {
                    if (typeof window.ethereum !== 'undefined') {
                        const web3 = new Web3(window.ethereum);
                        window.ethereum.enable().then(function() {
                            web3.eth.getAccounts().then(function(accounts) {
                                // Выводим номер первого кошелька
                                const walletAddress = accounts[0];
                                resolve(walletAddress);
                            });
                        }).catch(function(error) {
                            reject(new Error(error));
                        });
                    } else {
                        reject(new Error("MetaMask не найден"));
                    }
                });
            }
        },
        initWalletConnect: function() {
            $(document).on('click', '.walletconnect-switcher_btn', function(event) {
                event.preventDefault();
                var switchInput = $(this).find('input');
                switchInput.prop('checked', !switchInput.is(':checked'));
                console.log('Click');
            });
        },
        init: function() {
            this.initMetamask();
            this.initWalletConnect();
        }
    };

    coinSwitchers.init();
});