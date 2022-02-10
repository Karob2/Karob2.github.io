function onPageLoad() {
    var psaType = document.getElementById('psaType');
    var psaTitle = document.getElementById('psaTitle');
    var psaMessage = document.getElementById('psaMessage');
    var psaImageLink = document.getElementById('psaImageLink');

    // var psaTest = document.getElementById('psaTest');
    var psaCopy = document.getElementById('psaCopy');
    var psaReset = document.getElementById('psaReset');

    var preview = document.getElementById('preview');

    var outputType = document.getElementById('outputType');
    var outputTitle = document.getElementById('outputTitle');
    var outputMessage = document.getElementById('outputMessage');
    var outputImageLink = document.getElementById('outputImageLink');
    var outputEdit = document.getElementById('outputEdit');

    var psaDiv = document.getElementById('psaDiv');
    var previewDiv = document.getElementById('previewDiv');
    var outputDiv = document.getElementById('outputDiv');

    outputType.value = psaType.options[psaType.selectedIndex].text;
    psaType.addEventListener('input', () => {
        outputType.value = psaType.options[psaType.selectedIndex].text;
        updatePreview()
    });

    outputTitle.value = psaTitle.value
    psaTitle.addEventListener('input', () => {
        outputTitle.value = psaTitle.value
        updatePreview()
    });

    outputMessage.value = psaMessage.value.replaceAll('\n','!n')
    psaMessage.addEventListener('input', () => {
        outputMessage.value = psaMessage.value.replaceAll('\n','!n')
        updatePreview()
    });

    outputImageLink.value = psaImageLink.value
    psaImageLink.addEventListener('input', () => {
        outputImageLink.value = psaImageLink.value
        updatePreview()
    });

    // psaTest.addEventListener('click', () => {
    //     updatePreview()
    // });

    outputDiv.style.display = 'none'
    psaCopy.addEventListener('click', () => {
        // copyImageLink.scrollIntoView();
        psaDiv.style.display = 'none'
        // previewDiv.style.display = 'none'
        outputDiv.style.display = 'block'
    });
    outputEdit.addEventListener('click', () => {
        psaDiv.style.display = 'block'
        // previewDiv.style.display = 'block'
        outputDiv.style.display = 'none'
    });

    psaReset.addEventListener('click', () => {
        result = confirm('Remove all text?')
        if (result) resetAll()
    });

    copyTitle.addEventListener('click', () => {
        copy(outputTitle.value)
    });
    copyMessage.addEventListener('click', () => {
        copy(outputMessage.value)
    });
    copyImageLink.addEventListener('click', () => {
        copy(outputImageLink.value)
    });

    updatePreview()
}

var tags = {
    'bold': 'b',
    'underline': 'u',
    'strike': 'strike',
    'italic': 'i',
    'code': 'span class="code"'
}

var charConversions = {
    '\n': '<br/>',
    '<': '&lt;',
    '>': '&gt;'
}

var bannerTypes = [
    'Announcement',
    'Auction',
    'Event',
    'Maintenance',
    'Shop'
]

function updatePreview() {
    // Format: bold, italic, underscore, strikethrough,
    //     code block, emoji, links
    // preview.innerHTML = psaMessage.value.replaceAll('\n', '<br/>')
    message = outputMessage.value
    stack = [['base', 0]]
    formatted = ['']
    for (i = 0; i < message.length; i++) {
        char = message.charAt(i)
        dbl = message.slice(i, i + 2)
        tag = ''
        if (dbl === '**') tag = 'bold'
        if (dbl === '__') tag = 'underline'
        if (dbl === '~~') tag = 'strike'
        if (dbl === '!n') {
            formatted[formatted.length - 1] += '<br/>'
            i++
            continue
        }
        if (tag === '') {
            if (char === '*' || char == '_') tag = 'italic'
            if (char === '`') tag = 'code'
            // if (char === '\n') {
            //     formatted[formatted.length - 1] += '<br/>'
            //     continue
            // }
        } else {
            i++
        }
        if (tag === '') {
            if (char in charConversions) char = charConversions[char]
            formatted[formatted.length - 1] += char
            continue
        }
        closedTag = false
        for (j = stack.length - 1; j >= 0; j--) {
            if (stack[j][0] === tag) {
                // formatted.splice(stack[j][1], 0, `%${tags[tag]}>`)
                formatted[stack[j][1]] = `<${tags[tag]}>` + formatted[stack[j][1]]
                formatted.push(`</${tags[tag].split(' ')[0]}>`)
                formatted.push('')
                stack.splice(j, 1)
                closedTag = true
                break
            }
        }
        if (!closedTag) {
            stack.push([tag, formatted.length])
            formatted.push('')
        }
    }
    let imageLink = ''
    if (bannerTypes.includes(outputType.value)) {
        imageLink = `img/${outputType.value.toLowerCase()}.png`
    } else if (outputType.value === "Custom") {
        imageLink = outputImageLink.value
    }
    preview.innerHTML = `<h3>${outputTitle.value}</h3>${formatted.join('')}<br/><br/><img src="${imageLink}">`
}

function resetAll() {
    psaType.selectedIndex = 0;
    outputType.value = psaType.options[psaType.selectedIndex].text

    psaTitle.value = ''
    outputTitle.value = ''

    psaMessage.value = ''
    outputMessage.value = ''

    psaImageLink.value = ''
    outputImageLink.value = ''

    preview.innerHTML = ''
}

function copy(input) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(input).then(() => {
            console.log('Copied to clipboard successfully.');
        }, (err) => {
            console.log('Failed to copy the text to clipboard.', err);
        });
    } else if (window.clipboardData) {
        window.clipboardData.setData("Text", input);
    }
}
