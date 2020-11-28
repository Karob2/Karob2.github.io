var checkset = { }
var filter_options = {
    keep_after_refresh: false,
    multicheck: false
}

function filter(item) {
    checkboxes = document.getElementsByClassName("pagefilter")[0].getElementsByClassName("checkitem")

    if (!filter_options.keep_after_refresh) {
        if (item == null) item = document.getElementById("all")
    }

    if (item != null) {
        if (!filter_options.multicheck) {
            item.checked = true
            for (i = 0; i < checkboxes.length; i++) {
                child = checkboxes[i].firstElementChild
                if (child.id != item.id) child.checked = false
            }
        } else {
            if (item.id == "all") {
                item.checked = true
                for (i = 0; i < checkboxes.length; i++) {
                    child = checkboxes[i].firstElementChild
                    if (child.id != "all") child.checked = false
                }
            } else {
                document.getElementById("all").checked = false
                if (!item.checked) {
                    var anycheck = false
                    for (i = 0; i < checkboxes.length; i++) {
                        child = checkboxes[i].firstElementChild
                        if (child.checked) {
                            anycheck = true
                            break
                        }
                    }
                    if (!anycheck) document.getElementById("all").checked = true
                }
            }
        }
    }

    if (document.getElementById("all").checked) {
        for (i = 0; i < checkboxes.length; i++) {
            child = checkboxes[i].firstElementChild
            if (child.id == "all") continue
            checkset[child.id] = true
        }
    } else {
        for (i = 0; i < checkboxes.length; i++) {
            child = checkboxes[i].firstElementChild
            if (child.id == "all") continue
            if (child.checked) checkset[child.id] = true
            else checkset[child.id] = false
        }
    }

    for (const [key, value] of Object.entries(checkset)) {
        if (value) show(key)
        else hide(key)
    }
}

function show(type) {
    pages = document.getElementsByClassName("page-" + type)
    for (i = 0; i < pages.length; i++) {
        pages[i].style.display = "block"
    }
}

function hide(type) {
    pages = document.getElementsByClassName("page-" + type)
    for (i = 0; i < pages.length; i++) {
        pages[i].style.display = "none"
    }
}

function pageload() {
    // Reset or apply content filters.
    filter()

    // Force iframes to load the correct content.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=356558
    var embeds = document.getElementsByTagName("iframe");
    for (i = 0; i < embeds.length; i++) {
        embeds[i].contentWindow.location.href = embeds[i].src
    }
}