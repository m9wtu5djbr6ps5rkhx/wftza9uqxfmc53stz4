const swiper = new Swiper('.reviews .swiper', {
    loop: true,
    slidesPerView: 1,
    pagination: {
        el: '.reviews-slider-pagination',
        clickable: true,
    },
    autoHeight: true,
    spaceBetween: 20,
    navigation: {
        nextEl: '.reviews-slider__next',
        prevEl: '.reviews-slider__prev',
    },
});

const swiper2 = new Swiper('.benefits-slider .swiper', {
    loop: false,
    slidesPerView: 1,
    pagination: {
        el: '.benefits-slider-pagination',
        clickable: true,
    },
    spaceBetween: 20,
    navigation: {
        nextEl: '.benefits-slider__next',
        prevEl: '.benefits-slider__prev',
    },
    breakpoints: {
        501: {
            slidesPerView: 2
        },
        1024: {
            slidesPerView: 3
        },
        1180: {
            slidesPerView: 4
        },
    }
});

closeButtons = document.querySelectorAll('.modal-window-close');

closeButtons.forEach(function(item){

    item.addEventListener('click', function(e) {
        var parentModal = this.closest('.modal');
        parentModal.classList.remove('active');
    });
});

var accItem = document.getElementsByClassName('faq-accordion-item');
var accHD = document.getElementsByClassName('faq-accordion-btn');
for (var i = 0; i < accHD.length; i++) {
    accHD[i].addEventListener('click', toggleItem, false);
}
function toggleItem() {
    var item = this.parentNode;

    if (item.classList.contains('open')) {
        this.classList.remove('active');
        item.classList.remove('open');
    } else {
        for (i = 0; i < accItem.length; i++) {
            accItem[i].classList.remove('open');
            accHD[i].classList.remove('active');
            item.classList.add('open');
            this.classList.add('active')
        }
    }
}

var sidebarMenu = document.querySelectorAll('.sidebar-title');
var sidebarAnchorMenu = document.querySelectorAll('.page-with-sidebar-heading');

function mobSidebar(button){
    if (window.innerWidth < 501) {
        button.forEach(function(item){
            item.addEventListener('click', function (){
                this.classList.toggle('active');
            })
        })
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(function (){
        document.querySelector('.site-main').classList.add('animated')
    }, 0)

    mobSidebar(sidebarMenu);
    mobSidebar(sidebarAnchorMenu);

    window.addEventListener('resize orientationchange',function (){
        mobSidebar(sidebarMenu);
        mobSidebar(sidebarAnchorMenu);
    });
});

jQuery(document).ready(function($){

    const sortLinks = $('.sidebar-list-item-link[data-sort]');

    sortLinks.on('click', function (event) {
        event.preventDefault();

        const sortValue = $(this).data('sort');

        // Оновлення URL з параметром сортування
        const newUrl = updateQueryStringParameter(window.location.href, 'sort', sortValue);
        history.pushState(null, null, newUrl);

        // Оновлення блоку з постами через AJAX
        $.get(newUrl, function (data) {
            const blogItems = $(data).find('.blog-items');
            $('.blog-items').html(blogItems.html());

            // Оновлення пагінації
            const pagination = $(data).find('.pagination');
            $('.pagination').html(pagination.html());

            // Додаткова логіка для виділення активного посилання або виконання інших дій
            sortLinks.removeClass('active');
            $(this).addClass('active');
        });
    });

    // Функція для оновлення параметрів у URL
    function updateQueryStringParameter(uri, key, value) {
        const re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        const separator = uri.indexOf('?') !== -1 ? "&" : "?";
        if (uri.match(re)) {
            return uri.replace(re, '$1' + key + "=" + value + '$2');
        } else {
            return uri + separator + key + "=" + value;
        }
    }

    var searchInput = $('#searchInput');
    var searchResults = $('#searchResults');

    searchInput.on('input', function () {
        var searchTerm = searchInput.val();
        if (searchTerm.length >= 2) {
            // Відправте AJAX-запит
            $.ajax({
                type: 'POST',
                url: ajax_object.ajax_url, // Це глобальна змінна WordPress, яка містить URL для обробки AJAX-запитів
                data: {
                    action: 'search_blog_posts',
                    search_term: searchTerm,
                },
                success: function (response) {
                    // Оновлення випадаючого списку з результатами пошуку
                    searchResults.html(response).show();
                },
            });
        } else {
            // Сховати випадаючий список, якщо текст не введено або введено менше 2 символів
            searchResults.hide();
        }
    });

    // Сховати випадаючий список при кліку за межі нього
    $(document).on('click', function (e) {
        if (!searchResults.is(e.target) && searchResults.has(e.target).length === 0) {
            searchResults.hide();
        }
    });

    // Заповнення поля пошуку при виборі результату з випадаючого списку
    searchResults.on('click', 'li', function () {
        var selectedPostTitle = $(this).text();
        searchInput.val(selectedPostTitle);
        searchResults.hide();
    });




    $('.page-with-sidebar-nav-item-link').on('click', function(e){
        e.preventDefault();

        var targetId = $(this).attr('href');
        var offset = $(targetId).offset().top - 160;

        $('html, body').animate({
            scrollTop: offset
        }, 1000); // Задайте бажану тривалість анімації в мілісекундах
    });

    if ($('.reviews__slider').length > 0) {
        $('.read-more').click(function () {
            $(this).closest('.swiper-wrapper').css('height', 'auto');
            $(this).closest('.reviews-slider-item__content').addClass('opened')
        })
        $('.read-less').click(function () {
            $(this).closest('.swiper-wrapper').css('height', 'auto');
            $(this).closest('.reviews-slider-item__content').removeClass('opened')
        })
    }
});