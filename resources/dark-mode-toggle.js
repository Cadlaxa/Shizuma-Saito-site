const darkModeSound = new Audio("resources/sfx/darkmode.mp3");
const lightModeSound = new Audio("resources/sfx/lightmode.mp3");


const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const prefersLight = window.matchMedia('(prefers-color-scheme: light)'); 


let currentMode = null;

function toggleDarkMode(newState, playSound = true, updateCookie = true) {
    if (newState === "on" && currentMode !== "on") {
        DarkReader.enable({ contrast: 110 });
        document.querySelector("div.dark-mode-toggle").firstElementChild.className = "gg-sun";
        if (updateCookie) setCookie("darkmode", "on", 9999);
        if (playSound) {
            darkModeSound.currentTime = 0;
            darkModeSound.play();
        }
        currentMode = "on";
    } else if (newState === "off" && currentMode !== "off") {
        DarkReader.disable();
        document.querySelector("div.dark-mode-toggle").firstElementChild.className = "gg-moon";
        if (updateCookie) setCookie("darkmode", "off", 9999);
        if (playSound) {
            lightModeSound.currentTime = 0;
            lightModeSound.play();
        }
        currentMode = "off";
    }
}


document.querySelector("div.dark-mode-toggle").addEventListener("click", function () {
    const darkreaderActive = document.querySelector(".darkreader");
    toggleDarkMode(darkreaderActive ? "off" : "on");
}, false);


function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    document.cookie = `${cname}=${cvalue};expires=${d.toUTCString()};path=/`;
}

function getCookie(cname) {
    const name = cname + "=";
    return document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name))?.substring(name.length) || "";
}


window.addEventListener("load", function () {
    const darkModeCookie = getCookie("darkmode");

    
    if (prefersLight.matches && darkModeCookie === "on") {
        toggleDarkMode("off", false, true); 
    }
    
    else if (darkModeCookie === "on" || (darkModeCookie === "" && prefersDark.matches)) {
        toggleDarkMode("on", false, darkModeCookie !== "on");
    } else {
        toggleDarkMode("off", false, darkModeCookie !== "off");
    }
}, false);


if (window.matchMedia) {
    prefersDark.addEventListener("change", (e) => {
        const systemPref = e.matches ? "on" : "off";
        const darkModeCookie = getCookie("darkmode"); 

        
        
        if (prefersLight.matches && darkModeCookie === "on") {
            toggleDarkMode("off", true, true);
        } else {
            
            toggleDarkMode(systemPref, true, true);
        }
    });
}