#2018-01-22
version_num = 'B1.1'
# B1.1 adds hanging double-quote (multi-paragraph quote) support
# Todo:
#  - Ensure scene breaks are followed by at least a line of content before breaking to the next page.
#  - Possibly standardize whether section breaks appear at end of page or beginning of next page.
#  - Nightmode
#  - Printable/copyable version.

f1 = open('E:\Documents\Writings\Write (Stories)\story projects\\naiad.txt', 'r', encoding = 'UTF-8')
f2 = open('naiad.html', 'w', encoding = 'UTF-8')
#SKIP_WHITESPACE = 1
PARSE_TEXT = 2
AREA_COMMENT = 3
#LINE_COMMENT = 1
#AREA_COMMENT = 2
#commentmode = 0

class Marker:
    def __init__(self, a):
        self.text = a
        self.step = 0

    def stepMarker(self, a):
        if self.text[self.step] == a:
            self.step += 1
            if self.step == len(self.text):
                self.step = 0
                return True
        else:
            self.step = 0
        return False

    def resetMarker(self):
        self.step = 0

class MarkerList:
    markers = []
    @staticmethod
    def addMarker(a):
        MarkerList.markers.append(Marker(a))
        return len(MarkerList.markers) - 1
    @staticmethod
    def stepAllMarker(a):
        match_id = -1
        for i in range(0, len(MarkerList.markers)):
            if MarkerList.markers[i].stepMarker(a) == True:
                match_id = i
        return match_id
    @staticmethod
    def resetAllMarker():
        for m in MarkerList.markers:
            m.resetMarker()
    @staticmethod
    def cutMarker(a, i):
        #removes the marker from the beginning of a string
        return a[:-len(MarkerList.markers[i].text)]

marker_comment = MarkerList.addMarker('//')
marker_startcomment = MarkerList.addMarker('/*')
marker_endcomment = MarkerList.addMarker('*/')
marker_startitalic = MarkerList.addMarker('/~')
marker_enditalic = MarkerList.addMarker('~/')
marker_emdash = MarkerList.addMarker('- ')
#marker_hangingquote = MarkerList.addMarker('"')
#marker_timeskip = MarkerList.addMarker('<...>')
#marker_timeskip2 = MarkerList.addMarker('<......>')

f2.write('<!--Compiled with Storywriter ' + version_num + '-->\n')
f3 = open('header.txt', 'r', encoding = 'UTF-8')
for line in f3:
    f2.write(line)
f3.close()

f2.write('<div class="page">\n<span class="pagenumber">Page 1</span>\n')

characters_per_page = 2300
characters_per_line = 70

linemode = PARSE_TEXT
stringbuf = ''
word_count = 0
consecutive_newline = 0
print_line = 0
line_count = 0
chapter_count = 0
first_chapter = 1
page_count = 1
character_count = 0
format_char_count = 0
force_new_page = 0

italic_toggle = 0
quote_toggle = 0
doublequote_toggle = 0

chapter_type = ''
chapter_title = ''
chapter_shortname = ''

for line in f1:
    line_count += 1;

    #check for section headers
    if line_count == 1:
        #title
        chapter_shortname = ' '.join(line.split()) #hack for when no chapters present
        f2.write('<h1>' + chapter_shortname + '</h1>\n')
        character_count += characters_per_line
        continue
    elif line_count == 2:
        #author
        chapter_title = ' '.join(line.split()) #hack for when no chapters present
        f2.write('<h4>' + chapter_title + '</h4>\n')
        character_count += characters_per_line
        continue
    if linemode != AREA_COMMENT:
        if len(line) > 0 and line[0] == '@':
            #chapter
            if first_chapter == 1:
                first_chapter = 0
            else:
                #all chapters but the first get page breaks
                page_count += 1
                character_count = 0
                format_char_count = 0 #probably not necessary
                force_new_page = 0
                f2.write('</div>\n<div class="page">\n<span class="pagenumber">Page ' + str(page_count) + '</span>\n')
            if len(line) > 1 and line[1] == '(':
                #custom unnumbered chapter, such as prologue
                chapter_type = (line.split(')')[0])[2:]
                chapter_type = ' '.join(chapter_type.split())
                chapter_title = line[len(chapter_type) + 3:]
                chapter_title = ' '.join(chapter_title.split())
                chapter_shortname = chapter_type + '&mdash;' + chapter_title
            else:
                #numbered chapter
                chapter_count += 1
                chapter_type = "Chapter " + str(chapter_count)
                chapter_title = line[1:]
                chapter_title = ' '.join(chapter_title.split())
                chapter_shortname = str(chapter_count) + '&mdash;' + chapter_title
            f2.write('<p class="nohang">')
            f2.write('<h2>' + chapter_type + '</h2>\n')
            f2.write('<h3>' + chapter_title + '</h3>\n')
            f2.write('</p>')
            character_count += characters_per_line * 2
#            f2.write('<span class="pageheader">' + chapter_shortname + '</span>\n')
            continue

        #check for time breaks
        if len(line) >= 5 and line[0:5] == '<...>':
            #if character_count > 0:
            f2.write('<div class="shortbreak"></div>\n')
            character_count += characters_per_line * 1
            continue
        if len(line) >= 8 and line[0:8] == '<......>':
            f2.write('<div class="longbreak"></div>\n')
            character_count += characters_per_line * 3
            continue

    #parse text and comments
    MarkerList.resetAllMarker()
    for letter in line:
        result = MarkerList.stepAllMarker(letter)

        #parse area comments
        if linemode == AREA_COMMENT:
            if result == marker_endcomment:
                linemode = PARSE_TEXT
            continue

        #parse and accumulate text
        stringbuf += letter
        if result == marker_comment:
            #encountered single-line comment
            stringbuf = MarkerList.cutMarker(stringbuf, result)
            #print_line = 1 #print strbuf, reset buffer, continue
            break
        elif result == marker_startcomment:
            #encountered multi-line (area) comment
            stringbuf = MarkerList.cutMarker(stringbuf, result)
            linemode = AREA_COMMENT
            continue
        elif result == marker_startitalic:
            #start italic section
            italic_toggle = 1
            stringbuf = MarkerList.cutMarker(stringbuf, result)
            stringbuf += '<i>'
            format_char_count += len('<i>')
        elif result == marker_enditalic:
            #end italic section
            italic_toggle = 0
            stringbuf = MarkerList.cutMarker(stringbuf, result)
            stringbuf += '</i>'
            format_char_count += len('</i>')
        elif result == marker_emdash:
            #smartly convert hyphen to em dash
            stringbuf = MarkerList.cutMarker(stringbuf, result)
            stringbuf += '&mdash;'
            format_char_count += len('&mdash;') - 1
        elif letter == '"':
            #convert double quote to smart quote
            if doublequote_toggle == 1:
                doublequote_toggle = 0
                stringbuf = stringbuf[:-1]
                if len(stringbuf) > 0 and stringbuf[-1] == '/':
                    stringbuf = stringbuf[:-1]
                    stringbuf += '</span>'
                    format_char_count += len('</span>') - 1
                else:
                    stringbuf += '&rdquo;</span>'
                    format_char_count += len('&rdquo;</span>') - 1
            elif len(stringbuf) < 2 or stringbuf[-2] == ' ':
                doublequote_toggle = 1
                stringbuf = stringbuf[:-1]
                stringbuf += '<span class="dquote">&ldquo;'
                format_char_count += len('<span class="dquote">&ldquo;') - 1
        elif letter == "'":
            #convert single quote to smart quote
            if quote_toggle == 1:
                quote_toggle = 0
                stringbuf = stringbuf[:-1]
                stringbuf += '&rsquo;</span>'
                format_char_count += len('&rsquo;</span>') - 1
            elif len(stringbuf) < 2 or stringbuf[-2] == ' ':
                quote_toggle = 1
                stringbuf = stringbuf[:-1]
                stringbuf += '<span class="squote">&lsquo;'
                format_char_count += len('<span class="squote">&lsquo;') - 1
        elif letter == '\r' or letter == '\n':
            #encountered end of line
            print_line = 1 #print strbuf, reset buffer, continue
        elif letter == ' ':
            #encountered whitespace
            if ' '.join(stringbuf.split()) != '':
                print_line = 2 #2 = print partial line and continue parsing

        #print out accumulated text
        if print_line >= 1:
            stringbuf = ' '.join(stringbuf.split())
            if stringbuf == '':
                if consecutive_newline == 0:
                    #end paragraph
                    f2.write('</p>\n')
                    word_count = 0
                    consecutive_newline = 1
                    #line_count += 1
                    character_count += characters_per_line/2 #estimation
                    if character_count >= characters_per_page:
                        force_new_page = 1
            else:
                if word_count == 0:
                    #start paragraph
                    f2.write('<p>')
                    word_count = 1
                else:
                    #multi-line sentences joined together need a space between
                    f2.write(' ')
                    character_count += 1
                f2.write(stringbuf)
                character_count += len(stringbuf) - format_char_count
                word_count += len(stringbuf) - format_char_count
                format_char_count = 0
                consecutive_newline = 0
                if word_count > characters_per_line * 0.8 and character_count >= characters_per_page:
                    force_new_page = 2
            stringbuf = ''
            if force_new_page >= 1:
                page_count += 1
                character_count = 0
                format_char_count = 0 #probably not necessary
                if quote_toggle == 1:
                    f2.write('</span>')
                if italic_toggle == 1:
                    f2.write('</i>')
                if doublequote_toggle == 1:
                    f2.write('</span>')
                if force_new_page == 2:
                    f2.write('</p>\n')
                word_count = 1
                f2.write('</div>\n<div class="page">\n<span class="pagenumber">Page ' + str(page_count) + '</span>\n<span class="pageheader">' + chapter_shortname + '</span>\n')
                if force_new_page == 2:
                    f2.write('<p class="nohang">\n')
                else:
                    f2.write('<p>\n')
                if doublequote_toggle == 1:
                    f2.write('<span class="dquote">')
                if italic_toggle == 1:
                    f2.write('<i>')
                if quote_toggle == 1:
                    f2.write('<span class="squote">')
                character_count += characters_per_line * 1.5
                force_new_page = 0
            if print_line == 1:
                print_line = 0
                break
            print_line = 0

f2.write('</div>\n')

f3 = open('footer.txt', 'r', encoding = 'UTF-8')
for line in f3:
    f2.write(line)
f3.close()

f1.close()
f2.close()
