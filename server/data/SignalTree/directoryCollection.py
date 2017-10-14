# -*- coding: utf-8 -*- 
import os
import os.path
import json

if __name__ == "__main__":
	print("main function")
	for root, dirs, files in os.walk("./originalData"):
		print(files)
		fileObjArray = []
		# fileObjJson = json.dumps(fileObj)
		for name in files:
			pathFile = root + '/' + name
			print(pathFile)
			file = open(pathFile, 'rt', encoding='utf-8')
			count = 0
			for line in file:
				count = count + 1
				if count == 2:
					lineArray = line.split(',')
					aalNum = lineArray[2].split(',')[0].replace('"AAL数量: ', '').replace('字节', '')
					fileObj = {'name': name, 'flowNum': aalNum}
					fileObjArray.append(fileObj)
					break
		print(fileObjArray)
		fileObj = {
			'fileInfo': fileObjArray
		}
	with open('filesName.json', 'w') as outfile:
		json.dump(fileObj, outfile)
				
