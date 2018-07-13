var keys = {
    up: {
        bindings: [38, 87],
        held: false,
        toggled: false
    },
    down: {
        bindings: [40, 83],
        held: false,
        toggled: false
    },
    left: {
        bindings: [37, 65],
        held: false,
        toggled: false
    },
    right: {
        bindings: [39, 68],
        held: false,
        toggled: false
    }
}
function checkKey(key, k, state) {
    var found = false;
    for (var i = 0; i < key.bindings.length; i++) {
        if (k.which == key.bindings[i]) {
            found = true;
            break;
        }
    }
    if (!found) return;
    k.preventDefault();
    if (key.held != state) key.toggled = true;
    key.held = state
}
document.onkeydown = function(k) {
    checkKey(keys.up, k, true);
    checkKey(keys.down, k, true);
    checkKey(keys.left, k, true);
    checkKey(keys.right, k, true);
}
document.onkeyup = function(k) {
    checkKey(keys.up, k, false);
    checkKey(keys.down, k, false);
    checkKey(keys.left, k, false);
    checkKey(keys.right, k, false);
}
