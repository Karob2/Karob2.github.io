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
    'italic2': 'i',
    'code': 'pre class="code"',
    'codeblock': 'pre class="codeblock"'
}

var restoration = {
    'bold': '**',
    'underline': '__',
    'strike': '~~',
    'italic': '*',
    'italic2': '_',
    'code': '`',
    'codeblock': '```'
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

function lookForward(message, index, match) {
    // console.log(`index: ${index}`)
    for (let i = index + match.length; i <= message.length - match.length; i++) {
        // console.log(`i: ${i}`)
        check = message.slice(i, i + match.length)
        if (check !== match) continue
        return i
    }
    return -1
}

// TODO: Example button.
// TODO: Put copy buttons on input page, and change bottom copy button into view code or something.
// TODO: links
// TODO: emoji (including image uploads?)
// TODO: timestamps
function updatePreview() {
    // Format: bold, italic, underscore, strikethrough,
    //     code block, emoji, links
    // preview.innerHTML = psaMessage.value.replaceAll('\n', '<br/>')
    message = outputMessage.value
    stack = [['base', 0]]
    formatted = ['']
    for (let i = 0; i < message.length; i++) {
        char = message.charAt(i)
        nextChar = message.charAt(i + 1)
        prevChar = message.charAt(i - 1)
        dbl = message.slice(i, i + 2)
        tpl = message.slice(i, i + 3)
        tag = ''
        canOpen = true
        canClose = true
        if (char === '\\' && nextChar.length > 0) {
            formatted[formatted.length - 1] += nextChar
            i++
            continue
        }
        // if (tpl === '```') tag = 'codeblock'
        if (tpl === '```') {
            fwd = lookForward(message, i, '```')
            if (fwd >= 0) {
                formatted.push(`<pre class="codeblock">${message.slice(i + 3, fwd)}</pre>`)
                formatted.push('')
                i = fwd + 2
                continue
            }
        }
        if (tag === '') {
            if (dbl === '**') tag = 'bold'
            if (dbl === '__') tag = 'underline'
            if (dbl === '~~') tag = 'strike'
            // if (dbl === '!n') {
            //     formatted[formatted.length - 1] += '<br/>'
            //     i++
            //     continue
            // }
            if (tag === '') {
                if (char === '*') {
                    if (nextChar !== ' ') {
                        if (prevChar !== ' ') {
                            tag = 'italic'
                        } else {
                            tag = 'italic'
                            canClose = false
                        }
                    } else if (prevChar !== ' ') {
                        tag = 'italic'
                        canOpen = false
                    }
                }
                if (char === '_') tag = 'italic2'
                // if (char === '`') tag = 'code'
                if (char === '`') {
                    fwd = lookForward(message, i, '`')
                    if (fwd >= 0) {
                        formatted.push(`<pre class="code">${message.slice(i + 1, fwd)}</pre>`)
                        formatted.push('')
                        i = fwd
                        continue
                    }
                }
                // if (char === '\n') {
                //     formatted[formatted.length - 1] += '<br/>'
                //     continue
                // }
            } else {
                i++
            }
        } else {
            i += 2
        }
        if (tag === '') {
            if (char in charConversions) char = charConversions[char]
            formatted[formatted.length - 1] += char
            continue
        }
        closedTag = false
        if (canClose) {
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
        }
        if (!closedTag) {
            if (canOpen) {
                stack.push([tag, formatted.length])
                formatted.push('')
            } else {
                formatted[formatted.length - 1] += restoration[tag]
                continue
            }
        }
    }
    for (i = stack.length - 1; i > 0; i--) {
        rstr = restoration[stack[i][0]]
        formatted[stack[i][1]] = rstr + formatted[stack[i][1]]
    }
    let imageLink = ''
    if (outputType.value === "Custom" || outputImageLink.value !== '') {
        imageLink = outputImageLink.value
    } else {
        imageLink = `img/${outputType.value.toLowerCase()}.png`
    }
    // if (bannerTypes.includes(outputType.value)) {
    //     imageLink = `img/${outputType.value.toLowerCase()}.png`
    // } else if (outputType.value === "Custom") {
    //     imageLink = outputImageLink.value
    // }
    preview.innerHTML = `<h3>${outputTitle.value}</h3>${formatted.join('').replaceAll('!n','<br/>')}<br/><br/><img src="${imageLink}">`
    codeBlocks = document.getElementsByClassName('codeblock')
    for (codeBlock of codeBlocks) {
        console.log(codeBlock.innerHTML)
        working = codeBlock.innerHTML
        while (true) {
            if (working.charAt(0) === ' ') {
                working = working.slice(1, working.length)
                continue
            }
            if (working.slice(0, 4) === '<br>') {
                working = working.slice(4, working.length)
                continue
            }
            if (working.slice(0, 5) === '<br/>') {
                working = working.slice(5, working.length)
                continue
            }
            if (working.slice(working.length - 1, working.length) === ' ') {
                working = working.slice(0, working.length - 1)
                continue
            }
            if (working.slice(working.length - 4, working.length) === '<br>') {
                working = working.slice(0, working.length - 4)
                continue
            }
            if (working.slice(working.length - 5, working.length) === '<br/>') {
                working = working.slice(0, working.length - 5)
                continue
            }
            break
        }
        console.log(working)
        codeBlock.innerHTML = working
    }
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
