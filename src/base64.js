nuage.create_module({
    __name__: 'base64',
    __impl__: {

        b64encode: function(str){
            // non standard
            //https://developer.mozilla.org/en/DOM/window.btoa
            return btoa(str)
        },

        b64decode: function(b64){
            // non standard
            //https://developer.mozilla.org/en/DOM/window.atob
            return atob(b64)
        },
    }
})

