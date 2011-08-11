// ~~~~~~~~~~~~~~~~~~~ Pict API

Pict = {

    // Can be called by the widget

    openUrl: function(url) {
        this.send("openurl", {
            "url": url
        });
    },

    layoutChange: function() {
        Pict.send('ready', {
            title: document.getElementsByTagName('title')[0].innerHTML,
            icon: this.getIcon(),
            height: this.outerHeight()
        });
    },

    // Overridable

    onPortalConfig: function(data) {
    },

    getIcon: function() {
        var links = document.getElementsByTagName('link');
        for(var i=0; i<links.length; i++) {
            if (links[i].rel == 'shortcut icon') return links[i].href;
        }
        return null;
    },

    outerHeight: function() {
        if (window.attachEvent) {
            return document.body.offsetHeight + 30;
        }
        var height = document.body.scrollHeight;
        if (navigator.userAgent.indexOf("WebKit") > 0) return height;
        var computedStyle = document.defaultView.getComputedStyle(document.body, null);
        var margin = (computedStyle ? parseInt(computedStyle.marginTop, 10) : 0) +
            (computedStyle ? parseInt(computedStyle.marginBottom, 10) : 0);
        return height + margin;
    },

    // Internal use only, usage is not recommended

    autoload: true,

    onload: function() {
        Pict.send('load', {});
    },

    noAutoload: function() {
        Pict.autoload = false;
    },

    send: function(type, data) {
        var message = {type: type, data: data};
        if (window.parent && window.parent != window) {
            window.parent.postMessage(JSON.stringify(message), '*');
        }
    },

    onMessage: function(e) {
        var message = JSON.parse(e.data);
        var handler = Pict['on' + message.type];
        if(handler) handler(message.data);
    },

    // Events handler

    onconfigure: function(data) {
        Pict.onPortalConfig(data);
        Pict.send('ready', {
            title: document.getElementsByTagName('title')[0].innerHTML,
            icon: Pict.getIcon(),
            height: Pict.outerHeight()
        });
    }

};