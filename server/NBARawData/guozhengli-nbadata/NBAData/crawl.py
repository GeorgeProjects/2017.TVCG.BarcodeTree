#coding=utf-8
#! /usr/bin/env python

from selenium import webdriver
import time
import os
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')

browser = webdriver.Firefox()
browser.set_page_load_timeout(40)

# save json object to file
def saveFile(file_name, json_obj):
	with open(file_name + '.json', 'w') as f:
		json.dump(json_obj, f)
beginYear = 1946
EndYear = 2017#2016

year = beginYear
while(year <= EndYear):
	yearRootObj = {}
	yearRootObj['year'] = year
	print 'yearRootObj', yearRootObj
	teamNum = 1
	while(True):
		teamChildrenArray = []
		try:
			browser.get("http://www.landofbasketball.com/yearbyyear/"+ str(year) + "_" + str(year + 1) +"_teams.htm")
			time.sleep(2)
			try:
				# find the team name
				elementPath = "/html/body/div[1]/div[2]/main/div[5]/table/tbody/tr[" + str(teamNum) + "]/td/div[1]/a"
				teamElement = browser.find_element_by_xpath(elementPath)
				teamName = teamElement.get_attribute('innerHTML').replace(' ', '_')
				teamNameArray = teamName.split('_')
				teamNameLink = teamNameArray[-1]
				teamObj = {}
				print 1, teamName
				#find the summary path and click to change pages
				href = teamElement.get_attribute('href')
				summaryPath = "/html/body/div[1]/div[2]/main/div[5]/table/tbody/tr[" + str(teamNum) + "]/td/div[2]/div[1]/a[1]"
				# change the current page 
				try:
					if teamNameLink == "Blazers":
						teamNameLink = "trail_blazers"
					summaryPagePath = "http://www.landofbasketball.com/teams_by_year/"+ str(year) + "_" + str(year + 1) + "_" + teamNameLink.lower() + ".htm"
					print summaryPagePath
					browser.get(summaryPagePath)
				except Exception as e:
					print "can not find summary path"
					print e
				time.sleep(2)
				# find the division name  
				divisionPath = "/html/body/div[1]/div[2]/main/table[1]/tbody/tr[4]/td/div[2]/div[4]"
				# divisionPath = "table.no-pad:nth-child(10) > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(1) > div:nth-child(3) > div:nth-child(5) > a:nth-child(1)"
				try:
					divisionElement = browser.find_element_by_xpath(divisionPath)
				except Exception as e:
					print "can not find division element"
					print e

				divisionNameAll = divisionElement.get_attribute('innerHTML')
				divisionNameAllArray = divisionNameAll.split(' ')
				divisionName = ""
				for nameStr in divisionNameAllArray:
					nameStr = str(nameStr)
					if nameStr != "" and nameStr != "\n":
						if divisionName != "":
							divisionName = divisionName + "-" + nameStr
						else:
							divisionName = divisionName + nameStr	
				# Team Score
				# 84 /html/body/div[1]/div[2]/main/div[14]/table/tbody/tr[2]/td[11]
				# 80 /html/body/div[1]/div[2]/main/div[14]/table/tbody/tr[2]/td[11]
				# 78 /html/body/div[1]/div[2]/main/div[14]/table/tbody/tr[2]/td[11]
				# 73 /html/body/div[1]/div[2]/main/div[14]/table[1]/tbody/tr[2]/td[11]
				# 72 /html/body/div[1]/div[2]/main/div[14]/table[1]/tbody/tr[2]/td[11]
				# 71 /html/body/div[1]/div[2]/main/div[14]/table/tbody/tr[2]/td[11]
				# 69 /html/body/div[1]/div[2]/main/div[14]/table[1]/tbody/tr[2]/td[11]
				# 65 /html/body/div[1]/div[2]/main/div[14]/table[1]/tbody/tr[2]/td[11]

				# /html/body/div[1]/div[2]/main/div[14]/table[1]/tbody/tr[2]/td[11]
				# /html/body/div[1]/div[2]/main/div[15]/table/tbody/tr[2]/td[11]
				# if year >= 1972:
				# 	teamScorePath = "/html/body/div[1]/div[2]/main/div[14]/table[1]/tbody/tr[2]/td[11]"
				# else:
				# 	teamScorePath = "/html/body/div[1]/div[2]/main/div[15]/table[1]/tbody/tr[2]/td[11]"
				# try:
				# 	teamScoreElement = browser.find_element_by_xpath(teamScorePath)
				# except Exception as e:
				# 	if year >= 1972:
				# 		teamScorePath = "/html/body/div[1]/div[2]/main/div[14]/table/tbody/tr[2]/td[11]"
				# 	else:
				# 		teamScorePath = "/html/body/div[1]/div[2]/main/div[15]/table/tbody/tr[2]/td[11]"
				# 	try:
				# 		teamScoreElement = browser.find_element_by_xpath(teamScorePath)
				# 	except Exception as e:
				# 	print e
				# teamScorePath = "table.a-center:nth-child(3) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(11)"
				# try:
				# 	teamScoreElement = browser.find_element_by_css_selector(teamScorePath)
				# except Exception as e:
				# 	print e
				# 	print "can not find team score"
				teamScorePath = "/html/body/div[1]/div[2]/main/div[14]/table[1]/tbody/tr[2]/td[11]"
				try:
					teamScoreElement = browser.find_element_by_xpath(teamScorePath)
				except Exception as e:
					teamScorePath = "/html/body/div[1]/div[2]/main/div[14]/table/tbody/tr[2]/td[11]"
					try:
						teamScoreElement = browser.find_element_by_xpath(teamScorePath)
					except Exception as e:
						teamScorePath = "/html/body/div[1]/div[2]/main/div[15]/table[1]/tbody/tr[2]/td[11]"
						try:
							teamScoreElement = browser.find_element_by_xpath(teamScorePath)
						except Exception as e:
							teamScorePath = "/html/body/div[1]/div[2]/main/div[15]/table/tbody/tr[2]/td[11]"
							try:
								teamScoreElement = browser.find_element_by_xpath(teamScorePath)
							except Exception as e:
								print "can not find the team score"
								print e
				teamScore = teamScoreElement.get_attribute('innerHTML')
				# change the current page to the players page
				playersPath = "/html/body/div[1]/div[2]/main/table[1]/tbody/tr[4]/td/div[3]/div[5]/a"
				# playersPath = "table.no-pad:nth-child(10) > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(1) > div:nth-child(3) > div:nth-child(5) > a:nth-child(1)"
				try:
					time.sleep(2)
					playersPagePath = "http://www.landofbasketball.com/stats_by_team/"+ str(year) + "_" + str(year + 1) + "_" + teamNameLink.lower() + "_rs" + ".htm"
					# playersPagePath = browser.find_element_by_css_selector(playersPath).get_attribute('href')
					browser.get(playersPagePath)
				except Exception as e:
					print "can not find the player pages"
					print e
					try:
						# playersPagePath = browser.find_element_by_css_selector(playersPath).get_attribute('href')
						playersPagePath = "http://www.landofbasketball.com/stats_by_team/"+ str(year) + "_" + str(year + 1) + "_" + teamNameLink.lower() + "_rs" + ".htm"
						browser.get(playersPagePath)
					except Exception as e:
						print "can not find the player pages"
						print e
				time.sleep(2)
				#
				singlePlayerNum = 2
				playersObjArray = []
				while(True):
					try:
						playerObj = {}
						playersNamePath = "/html/body/div[1]/div[2]/main/div[8]/div/table/tbody/tr[" + str(singlePlayerNum) + "]/td[1]/a"
						playersPtsPath = "/html/body/div[1]/div[2]/main/div[8]/div/table/tbody/tr[" + str(singlePlayerNum) + "]/td[4]"
						playerElement = browser.find_element_by_xpath(playersNamePath)
						playersPtsElement = browser.find_element_by_xpath(playersPtsPath)
					except Exception as e:
						try:
							playersNamePath = "/html/body/div[1]/div[2]/main/div[9]/div/table/tbody/tr[" + str(singlePlayerNum) + "]/td[1]/a"
							playersPtsPath = "/html/body/div[1]/div[2]/main/div[9]/div/table/tbody/tr[" + str(singlePlayerNum) + "]/td[4]"
							playerElement = browser.find_element_by_xpath(playersNamePath)
							playersPtsElement = browser.find_element_by_xpath(playersPtsPath)
						except Exception as e:
							print "can not find the players path"
							print e
							break
					playerName = playerElement.get_attribute('innerHTML')
					playerPtsNum = playersPtsElement.get_attribute('innerHTML')
					playerObj["name"] = playerName.replace('\n\t\t', '')
					playerObj["pts"] = playerPtsNum.replace('\n\t\t', '')
					playersObjArray.append(playerObj)
					singlePlayerNum = singlePlayerNum + 1
				teamObj = {}
				teamObj["teamName"] = teamName
				teamObj["teamScore"] = teamScore
				teamObj["playersObjArray"] = playersObjArray
				divisionNameAllArray2 = divisionName.split('-')
				if len(divisionNameAllArray2) == 4:
					finalConferenceName = divisionNameAllArray2[-2]
					#	this year is belong to the previous and only have conference division
					finalConferenceObj = getattr(yearRootObj, finalConferenceName, None)
					if finalConferenceName in yearRootObj:
						yearRootObj[finalConferenceName].append(teamObj)
					else:
						yearRootObj[finalConferenceName] = []
						yearRootObj[finalConferenceName].append(teamObj)
				elif len(divisionNameAllArray2) == 8:
					finalConferenceName = divisionNameAllArray2[2]
					finalDivisionName = divisionNameAllArray2[-2]	
					#	this year belong to the later and have both the conference and division
					if finalConferenceName in yearRootObj:
						if finalDivisionName in yearRootObj[finalConferenceName]:
							yearRootObj[finalConferenceName][finalDivisionName].append(teamObj)
						else:
							yearRootObj[finalConferenceName][finalDivisionName] = []
							yearRootObj[finalConferenceName][finalDivisionName].append(teamObj)
					else:
						yearRootObj[finalConferenceName] = {}
						yearRootObj[finalConferenceName][finalDivisionName] = []
						yearRootObj[finalConferenceName][finalDivisionName].append(teamObj)
			except Exception as e:
				print "the inner exceptions"
				print e
				break
			teamNum = teamNum + 1
		except Exception as e:
			print "can not find year pages"
			time.sleep(20)
			browser.quit()
			browser = webdriver.Firefox()
			browser.set_page_load_timeout(40)
			print e
	saveFile(str(year), yearRootObj)
	year = year + 1
	print year
	time.sleep(2)


#browser.get("http://www.landofbasketball.com/yearbyyear/"+1946_1947+"_teams.htm")
#time.sleep(2)

#########百度输入框的定位方式##########

#通过id方式定位


# browser.find_element_by_id("kw").send_keys("selenium")

# #通过name方式定位
# browser.find_element_by_name("wd").send_keys("selenium")

# #通过tag name方式定位
# browser.find_element_by_tag_name("input").send_keys("selenium")

# #通过class name 方式定位
# browser.find_element_by_class_name("s_ipt").send_keys("selenium")

# #通过CSS方式定位
# browser.find_element_by_css_selector("#kw").send_keys("selenium")

#通过xphan方式定位
# sort = "//*[@id='sort-selector']/th[4]/a"
# browser.find_element_by_xpath(sort).click()
# time.sleep(2)
# page = 82
# root = '/home/wakouboy/Downloads'
# nxt = '//*[@id="filterrific_results"]/div[4]/ul/li[14]/a'
# while(1):
# 	try:
# 		page = page + 1
# 		purl = "https://sparse.tamu.edu/?filterrific=" + "%23%" + "3CActionController%3A%3AParameters%3A0x007fa4b52a2978%3E&page="
# 		purl = purl + str(page)
# 		browser.get(purl)
# 		for i in range(1, 21):
# 			print(i)
		
# 			url = "//*[@id='matrices']/tbody/tr["+ str(i) + "]/td[9]/a[3]"
# 			a = browser.find_element_by_xpath(url)
# 			href = a.get_attribute('href')
# 			filename = href.split('/')[-1]
# 			print(filename)
# 			a.click()
# 			while(1):
# 				if os.path.isfile(root + '/' + filename + '.part'):
# 					time.sleep(10)
# 				elif os.path.isfile(root + '/' + filename):
# 					break
# 				else:
# 					time.sleep(10)
		
# 		# browser.find_element_by_xpath(nxt).click()
# 		time.sleep(2)
# 		print('current page ', page)
# 	except Exception as e:
# 		browser.find_element_by_xpath(nxt).click()
# 		print(e)
############################################
time.sleep(3)
