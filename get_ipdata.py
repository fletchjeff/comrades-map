#!/usr/bin/python
import pygeoip
import socket
import pymongo
import time

time.sleep(10)

connection = pymongo.MongoClient('localhost', 27017)
db = connection.attack_map
collection = db.attacks

# returns the dns name from the ip


def reverse_dns(ip):
    try:
        return socket.gethostbyaddr(ip)[0]
    except:
        return "None"

# list of common services
services = {
    '21': 'ftp', '22': 'ssh', '23': 'telnet', '80': 'http', '445': 'microsoft-ds', '68': 'bootpc', '25': 'mail', '139': 'netbios-ssn',
    '135': 'loc-srv', '3128': 'proxy', '1813': 'radius', '47065': 'unassigned', '88': 'kerberos', '56': 'xns', '67': 'bootps', '28': 'unassigned'}


# logfile from honeyd server
logfile = open('/var/www/dev/attack_map/data/honeyd.log')

# the most recent and previous update time_stamps
previous = db.most_recent.find_one()['previous']
most_recent = db.most_recent.find_one()['most_recent']

# GeoIP connectors to query IP address
geoip_country = pygeoip.GeoIP('/var/www/dev/attack_map/data/GeoIP.dat', pygeoip.MEMORY_CACHE)
geoip_city = pygeoip.GeoIP('/var/www/dev/attack_map/data/GeoLiteCity.dat')
geoip_as = pygeoip.GeoIP('/var/www/dev/attack_map/data/GeoIPASNum.dat')

counter = 0

# iterates through the logfile, adds data and writes it out to the db
for line in logfile:

    # prints the current line as it goes through with a counter
    counter += 1
    # print str(counter) + ' ' + line.rstrip()

    this_line = line.split(" ")
    if this_line[0] > most_recent:

        # checks if the log file is actual data or a notification, on the 192
        # range or udp, if not it will proceed.
        if (str(this_line[1]) != "honeyd") and (this_line[3][:3] != '192') and (this_line[1][:3] != 'udp'):

            # parses the line and gets the correct information
            time_stamp = this_line[0]
            protocol = this_line[1]
            connection = this_line[2]
            src_ip = this_line[3]
            src_name = reverse_dns(str(this_line[3]))
            try:
                if this_line[6][-1] == ":":
                    port = this_line[6][:-1]
                    bytes_in = this_line[7]
                    try:
                        if this_line[8][:-1].isdigit():
                            bytes_out = this_line[8][:-1]
                        else:
                            bytes_out = '0'
                    except:
                        bytes_out = '0'
                else:
                    port = this_line[6]
                    bytes_in = '0'
                    bytes_out = '0'
            except:
                port = "0"
                bytes_in = '0'
                bytes_out = '0'

            try:
                service = services[port.rstrip()]
            except:
                service = "unassigned"
            try:
                finger_print = ""
                if this_line[7][0] == "[":
                    for items in this_line[7:]:
                        finger_print += items.rstrip() + " "

                else:
                    finger_print = 'None'
            except:
                finger_print = 'None'
            city_info = geoip_city.record_by_addr(this_line[3])
            try:
                country = city_info['country_name'].replace("'", "")
            except:
                country = 'None'
            try:
                city = city_info['city'].replace("'", "")
            except:
                city = 'None'
            try:
                lat = city_info['latitude']
            except:
                lat = '0'
            try:
                long = city_info['longitude']
            except:
                long = '0'

            try:
                as_num_info = geoip_as.org_by_addr(this_line[3])
                as_num = as_num_info.split(" ")[0][2:]
                isp = as_num_info.split(" ")[1]
            except:
                as_num = 0
                isp = "unknown"

            # writes to the database.
            attack_id = collection.insert({"time_stamp": time_stamp,
                                           "protocol": protocol,
                                           "connection": connection,
                                           "src_ip": src_ip,
                                           "src_name": src_name,
                                           "port": port.rstrip(),
                                           "service": service,
                                           "bytes_in": bytes_in,
                                           "bytes_out": bytes_out,
                                           "finger_print": finger_print,
                                           "country": country,
                                           "city": city,
                                           "lat": lat,
                                           "long": long,
                                           "as_num": as_num,
                                           "isp": isp
                                           })
# update the most recent time stamp
try:
    db.most_recent.update({"_id": 1}, {"$set": {"most_recent": time_stamp}})
    db.most_recent.update({"_id": 1}, {"$set": {"previous": most_recent}})
except NameError:
    #db.most_recent.update({"_id": 1}, {"$set": {"previous": most_recent}})
    time_stamp = most_recent
