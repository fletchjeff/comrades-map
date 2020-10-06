import re
import urllib2
from bs4 import BeautifulSoup


url = "http://results.ultimate.dk/comrades/resultshistory/front/index.php?results=true&Year=2013&Category=&StartRecord="

outfile = open('results.csv', 'w')
# f.write(the_page)
# f.close()

for pages in range(0, 103):
    req = urllib2.Request(url + str(10200))
    response = urllib2.urlopen(req)
    the_page = response.read()
    soup = BeautifulSoup(the_page, "lxml")
    for tag in soup.find_all(id=re.compile("search_")):
        # print tag.get_text()
        tds = tag.find_all("td")
        outline = "%s,%s,%s,%s,%s,%s" % (
            tds[0].string.split("/")[0].strip(" "),
            tds[5].string,
            tds[1].string,
            tds[3].string,
            tds[7].string.split(" ")[0],
            tds[7].string.split(" ")[1])
        print outline
        outfile.write(outline)
        outfile.write("\n")

outfile.close()
