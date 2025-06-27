const darkModeSound = new Audio("resources/sfx/darkmode.mp3");
const lightModeSound = new Audio("resources/sfx/lightmode.mp3");


function toggleDarkMode(newState) {
    var darkModeModification = '';

    if (newState == "on") {

        DarkReader.enable({
            contrast: 110
        });


        document.querySelector("div.dark-mode-toggle").firstElementChild.className = "gg-sun";


        document.head.insertAdjacentHTML("beforeend", darkModeModification);


        setCookie("darkmode", "on", 9999);


        darkModeSound.currentTime = 0;
        darkModeSound.play();
    } else {

        DarkReader.disable();


        document.querySelector("div.dark-mode-toggle").firstElementChild.className = "gg-moon";


        var cssMod = document.querySelector(".dark-mode-mod");
        if (cssMod) {
            cssMod.parentElement.removeChild(cssMod);
        }

        var darkModeModificationOff = '';
        document.head.insertAdjacentHTML("beforeend", darkModeModificationOff);


        setCookie("darkmode", "off", 9999);


        lightModeSound.currentTime = 0;
        lightModeSound.play();
    }
}


document.querySelector("div.dark-mode-toggle").addEventListener("click", function () {
    if (document.querySelector(".darkreader")) {
        toggleDarkMode("off");
    } else {
        toggleDarkMode("on");
    }
}, false);


function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}


function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


window.addEventListener("load", function () {
    var darkModeCookie = getCookie("darkmode");
    if (darkModeCookie == "on") {
        toggleDarkMode("on");
    }
}, false);


if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (e.matches) {
            toggleDarkMode("on");
        } else {
            toggleDarkMode("off");
        }
    });
}
