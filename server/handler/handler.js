//Worker: 各种处理程序，负责直接包装响应
//注意文件路径以最顶级的index.js为准
var fileType = {
  'json': 'application/json',
  'js': 'text/plain',
  'tpl': 'text/plain',
  'css': 'text/css',
  'less': 'text/plain',
  'png': 'image/png',
  'ico': 'image/ico',
  'html': 'text/html',
  'csv': 'text/comma-separated-values',
  'woff': 'application/x-font-woff',
  'woff2': 'application/x-font-woff',
  'ttf': 'application/octet-stream',
  'bmp': 'application/x-MS-bmp',
  'svg': 'image/svg-xml',
  'map': 'text/plain',
  'ico': 'image/vnd.microsoft.icon',
  'pdf': 'application/pdf'
}

var superTreeObj = {}
var clone = require('clone')
var fs = require('fs')
var existedFileObj = {}
var categoryObj = null
var categoryNodeArray = null
var categoryNodeObjArray = null
var categoryIndexObj = null
//  dataSetName是在所有的方法中通用的一个变量
var dataSetName = null
var PER_GAP_WIDTH = 4

function initialize(root, dataProcessor, handlerObj, v_logger, fs) {
  var resOpt = {
    root: root
  }
  var logger = v_logger
  //  之前的测试程序, 将name中的数字变成字符
  // num_to_character_preprocess()
  //  执行对于NBAdata的预处理函数NBA_preprocess时, 需要在originalData文件夹中改变文件名称为1946 - 2017.json
  // NBA_preprocess()
  //  对于recordTree数据的预处理函数
  function preprocess() {
    var filePath = './server/data/DailyRecordTree/originalData/'
    fs.readdir(filePath, function (err, files) {
      if (err) {
        console.log('err', err)
      }
      files.forEach(function (f) {
        if (f !== '.DS_Store') {
          var originalTreeObj = require('../data/DailyRecordTree/originalData/' + f)
          var originalTreeObj1 = addCategoryNameToObj(originalTreeObj)
          fs.writeFile(('./server/data/DailyRecordTree/originalData1/' + f), JSON.stringify(originalTreeObj1), 'utf8', function (err) {
            console.log('err', err)
          });
        }
      });
    })
  }

  //  对于recordTree的预处理函数
  function num_to_character_preprocess() {
    var filePath = './server/data/DailyRecordTree/originalData/'
    fs.readdir(filePath, function (err, files) {
      if (err) {
        console.log('err', err)
      }
      files.forEach(function (f) {
        if (f !== '.DS_Store') {
          var originalTreeObj = require('../data/DailyRecordTree/originalData/' + f)
          var originalTreeObj1 = changeObjNameAttr(originalTreeObj)
          fs.writeFile(('./server/data/DailyRecordTree/originalData4/' + f), JSON.stringify(originalTreeObj1), 'utf8', function (err) {
            console.log('err', err)
          });
        }
      });
    })
  }

  //  对于NBA数据的预处理函数, 预处理函数的输入是在数据文件夹下的raw data, 输出是在数据文件夹下的regularFormData
  function NBA_preprocess() {
    var dataFileName = "NBATeamTree"
    var filePath = './server/data/' +  dataFileName + '/rawData/'
    fs.readdir(filePath, function (err, files) {
      if (err) {
        console.log('err', err)
      }
      var regularFormTreeArray = []
      files.forEach(function (f) {
        if (f !== '.DS_Store') {
          var originalTreeObj = require('../data/' + dataFileName + '/rawData/' + f)
          var yearArray = f.split('.')
          var year = +yearArray[0]
          var regularFormDataObj = null
          //  从1970年开始数据的格式发生了变化, 因此使用不同的数据处理函数进行预处理
          if (year >= 1970) {
            regularFormDataObj = transform_to_regular_form_2(originalTreeObj)
          } else {
            regularFormDataObj = transform_to_regular_form(originalTreeObj)
          }
          regularFormTreeArray.push(regularFormDataObj)
          // fs.writeFile(('./server/data/NBATeamTree/regularFormData/' + f), JSON.stringify(regularFormDataObj), 'utf8', function (err) {
          //   console.log('err', err)
          // });
        }
      });
      //  根据tree对象的数组构建unionTree
      var unionTree = preprocess_build_union_tree(regularFormTreeArray)
      //  在unionTree中对于每个节点增加唯一标识的id
      add_identifier_to_union_tree(unionTree)
      //  遍历unionTree得到identifier和name对应的对象
      add_node_name(regularFormTreeArray, unionTree)
      //  计算treeObject中的num属性
      compute_num_attr(regularFormTreeArray)
      //  将修改好的对象写入到文件中
      write_file_obj(dataFileName, regularFormTreeArray)
      fs.writeFile(('./server/data/' + dataFileName +'/regularFormData/unionTree.json'), JSON.stringify(unionTree), 'utf8', function (err) {
        console.log('err', err)
      })
    })

    //  1970 - 2017年的格式下的转换函数
    function transform_to_regular_form_2(originalTreeObj) {
      //  初始化对象中所有的属性
      originalTreeObj.name = 'root'
      originalTreeObj.categoryName = 'root'
      originalTreeObj.children = []
      //  originalTreeObj.year这是原有的属性
      //  遍历对象中的元素, 选择某些元素进入children数组中, 这些元素的特点是属性为object, 而不是其他的属性
      for (var oItem in originalTreeObj) {
        //  只是处理分区的属性, 只有分区的属性才会变成children数组中的对象
        var firstDivisionObj = JSON.parse(JSON.stringify(originalTreeObj[oItem]))
        if ((typeof (firstDivisionObj) === 'object') && (oItem !== 'children')) {
          firstDivisionObj["categoryName"] = oItem
          firstDivisionObj["children"] = []
          //  后面的操作是填充firstDivisionObj["children"]
          for (var fItem in firstDivisionObj) {
            var secondDivisionArray = firstDivisionObj[fItem]
            if ((typeof (secondDivisionArray) === 'object') && (fItem !== 'children')) {
              var secondDivisionObj = {}
              secondDivisionObj['categoryName'] = fItem
              secondDivisionObj['children'] = JSON.parse(JSON.stringify(firstDivisionObj[fItem]))
              delete firstDivisionObj[fItem]
              for (var tI = 0; tI < secondDivisionObj['children'].length; tI++) {
                var teamObj = secondDivisionObj['children'][tI]
                teamObj["num"] = +teamObj["teamScore"]
                delete teamObj["teamScore"]
                teamObj["categoryName"] = teamObj["teamName"]
                delete teamObj["teamName"]
                teamObj['children'] = JSON.parse(JSON.stringify(teamObj["playersObjArray"]))
                delete teamObj["playersObjArray"]
                //  处理球员的对象
                var playerArray = teamObj['children']
                for (var pI = 0; pI < playerArray.length; pI++) {
                  var playerObj = playerArray[pI]
                  playerObj["num"] = +playerObj["pts"]
                  delete playerObj["pts"]
                  playerObj["categoryName"] = playerObj["name"]
                  delete playerObj["name"]
                }
              }
              firstDivisionObj["children"].push(secondDivisionObj)
            }
          }
          delete originalTreeObj[oItem]
          originalTreeObj.children.push(firstDivisionObj)
        }
      }
      return originalTreeObj
    }

    //  1946 - 1969年的格式下的转换函数
    function transform_to_regular_form(originalTreeObj) {
      //  初始化对象中所有的属性
      originalTreeObj.name = 'root'
      originalTreeObj.categoryName = 'root'
      originalTreeObj.children = []
      //  originalTreeObj.year这是原有的属性
      //  遍历对象中的元素, 选择某些元素进入children数组中, 这些元素的特点是属性为object, 而不是其他的属性
      for (var item in originalTreeObj) {
        //  处理球队的对象
        var divisionArray = originalTreeObj[item]
        //  只是处理分区的属性, 只有分区的属性才会变成children数组中的对象
        if ((typeof (divisionArray) === 'object') && (item !== 'children')) {
          var divisionObj = {}
          divisionObj['categoryName'] = item
          for (var tI = 0; tI < divisionArray.length; tI++) {
            var teamObj = divisionArray[tI]
            teamObj["num"] = +teamObj["teamScore"]
            delete teamObj["teamScore"]
            teamObj["categoryName"] = teamObj["teamName"]
            delete teamObj["teamName"]
            teamObj['children'] = JSON.parse(JSON.stringify(teamObj["playersObjArray"]))
            delete teamObj["playersObjArray"]
            //  处理球员的对象
            var playerArray = teamObj['children']
            for (var pI = 0; pI < playerArray.length; pI++) {
              var playerObj = playerArray[pI]
              playerObj["num"] = +playerObj["pts"]
              delete playerObj["pts"]
              playerObj["categoryName"] = playerObj["name"]
              delete playerObj["name"]
            }
          }
          divisionObj['children'] = JSON.parse(JSON.stringify(originalTreeObj[item]))
          delete originalTreeObj[item]
          originalTreeObj.children.push(divisionObj)
        }
      }
      return originalTreeObj
    }

    //  预处理过程中合并两个树对象的函数
    function preprocess_merge_two_tree_obj(treeObj1, treeObj2) {
      if ((treeObj1 == null) || (typeof(treeObj1) === 'undefined')) {
        if (typeof (treeObj2) !== 'undefined') {
          return treeObj2
        }
      } else if ((treeObj2 == null) || (typeof (treeObj2) === 'undefined')) {
        if (typeof (treeObj1) !== 'undefined') {
          return treeObj1
        }
      } else {
        var superTreeObj = {}
        superTreeObj['categoryName'] = treeObj1['categoryName']
        if (typeof (treeObj1.children) !== 'undefined') {
          superTreeObj.children = treeObj1.children
          if (typeof (superTreeObj.children) === 'undefined') {
            superTreeObj.children = []
          }
        }
        var nodeExist = false
        if (typeof (treeObj2.children) !== 'undefined') {
          for (var i = 0; i < treeObj2.children.length; i++) {
            nodeExist = false
            var childrenName = treeObj2.children[i].categoryName
            if (typeof(superTreeObj.children) === 'undefined') {
              superTreeObj.children = []
            }
            for (var j = 0; j < superTreeObj.children.length; j++) {
              var superTreeObjName = superTreeObj.children[j].categoryName
              if (childrenName === superTreeObjName) {
                nodeExist = true
                var mergeSubChild1 = superTreeObj.children[j]
                var mergeSubChild2 = treeObj2.children[i]
                var mergedSuperTree = preprocess_merge_two_tree_obj(mergeSubChild1, mergeSubChild2)
                superTreeObj.children.splice(j, 1, mergedSuperTree)
                break
              }
            }
            if (!nodeExist) {
              superTreeObj.children.push(treeObj2.children[i])
            }
          }
        }
        return superTreeObj
      }
      return
    }

    //  预处理过程中的操作, 构建unionTree
    function preprocess_build_union_tree(singleTreeObjArray) {
      var superTree = null
      //   完全合并所有的子树
      for (var sI = 0; sI < singleTreeObjArray.length; sI++) {
        var singleTreeObj = JSON.parse(JSON.stringify(singleTreeObjArray[sI]))
        superTree = preprocess_merge_two_tree_obj(superTree, singleTreeObj)
      }
      return superTree
    }

    //  向unionTree中的每个节点增加唯一标识的id
    function add_identifier_to_union_tree(unionTree) {
      var fatherName = ""
      unionTree.name = 'root'
      inner_add_identifier_to_union_tree(unionTree, fatherName)
      function inner_add_identifier_to_union_tree(unionTree, fatherName) {
        var treeChildren = unionTree.children
        if (typeof (treeChildren) !== 'undefined') {
          for (var tI = 0; tI < treeChildren.length; tI++) {
            var treeChildrenName = ""
            if (fatherName === "") {
              treeChildrenName = "" + (tI + 1)
            } else {
              treeChildrenName = fatherName + "_" + (tI + 1)
            }
            treeChildren[tI].name = transform_identifier_to_four_level(treeChildrenName)
            inner_add_identifier_to_union_tree(treeChildren[tI], treeChildrenName)
          }
        }
      }
    }

    //  write file对象中
    function write_file_obj(dataFileName, regularFormTreeArray) {
      var basedYear = 1946
      for (var rI = 0; rI < regularFormTreeArray.length; rI++) {
        var thisFileName = 'tree' + (basedYear + rI) + '.json'
        var regularFormDataObj = regularFormTreeArray[rI]
        fs.writeFile(('./server/data/' + dataFileName + '/regularFormData/' + thisFileName), JSON.stringify(regularFormDataObj), 'utf8', function (err) {
        })
      }
    }

    //  计算treeObject中的num属性
    function compute_num_attr(regularFormTreeArray) {
      for (var rI = 0; rI < regularFormTreeArray.length; rI++) {
        inner_compute_num_attr(regularFormTreeArray[rI])
      }
      //  计算节点的num属性, 节点的num属性是节点的children数组中节点的num属性之和
      function inner_compute_num_attr(regular_form_tree) {
        //  依次递归的计算下层节点的num属性
        if (typeof (regular_form_tree.children) !== 'undefined') {
          for (var cI = 0; cI < regular_form_tree.children.length; cI++) {
            inner_compute_num_attr(regular_form_tree.children[cI])
          }
        }
        //  只有当前节点的num属性为undefined时, 才需要计算当前节点的num属性
        if (typeof (regular_form_tree.num) === 'undefined') {
          //  如果当前节点的num属性为undefined, 那么就依据孩子节点的num属性计算当前节点的属性值
          if (typeof (regular_form_tree.children) === 'undefined') {
            regular_form_tree.num = 0
          } else {
            regular_form_tree.num = 0
            for (var cI = 0; cI < regular_form_tree.children.length; cI++) {
              regular_form_tree.num = regular_form_tree.num + regular_form_tree.children[cI].num
            }
          }
        }
      }
    }

    //  向树的对象中增加name元素
    function add_node_name(regularFormTreeArray, unionTree) {
      var correspondingObj = get_corresponding_object(unionTree)
      fs.writeFile(('./server/data/NBATeamTree/regularFormData/correspondingObj.json'), JSON.stringify(correspondingObj), 'utf8', function (err) {
        console.log('err', err)
      })
      for (var rI = 0; rI < regularFormTreeArray.length; rI++) {
        add_node_name_to_single_tree(correspondingObj, regularFormTreeArray[rI])
      }
    }

    //  向单个的树对象中增加node name属性
    //  目前一个categoryName与多个name相对应, 因此需要从多个name中找到对应的name
    //  需要根据父亲节点的name决定孩子的正确的name, 需要保证的是孩子节点紧跟着父亲节点的name下一个值变成非0, 而后面的值依然保持是0
    function add_node_name_to_single_tree(correspondingObj, singleTree) {
      var initDepth = 0
      var fatherName = ""
      inner_add_node_name_to_single_tree(correspondingObj, singleTree, fatherName, initDepth)
      function inner_add_node_name_to_single_tree(correspondingObj, singleTree, fatherName, depth) {
        var currentDepth = depth - 1
        if (currentDepth === 0) {
          fatherName = "0_0_0_0"
        }
        var categoryName = singleTree["categoryName"]
        var nameArray = correspondingObj[categoryName]
        if (depth !== 0) {
          //  如果当前的节点的depth为0, 那么就不用一一匹配, 节点的name为"root"
          var fatherSplitNameArray = fatherName.split('_')
          var correspondingName = ""
          //  1. depth以前的id需要相同, 2. 当前depth的id非0, 3. depth以后的id为0
          for (var nI = 0; nI < nameArray.length; nI++) {
            var name = nameArray[nI]
            var isSatisfy = true
            var nameSplitArray = name.split('_')
            for (var sI = 0; sI < nameSplitArray.length; sI++) {
              if (sI < currentDepth) {
                //  第一个判断条件
                if (nameSplitArray[sI] == fatherSplitNameArray[sI]) {
                } else {
                  isSatisfy = false
                  break
                }
              } else if (sI == currentDepth) {
                //  第二个判断条件
                if (nameSplitArray[sI] != 0) {
                } else {
                  isSatisfy = false
                  break
                }
              } else if (sI > currentDepth) {
                //  第三个判断条件
                if (nameSplitArray[sI] == 0) {
                } else {
                  isSatisfy = false
                  break
                }
              }
            }
            //  找到了满足条件的id, 那么就跳出找id的循环条件
            if (isSatisfy) {
              correspondingName = nameArray[nI]
              break
            }
          }
          // console.log('correspondingName', categoryName)
          //  如果当前的correspondingName不为"", 那么说明找到了正确的name, 否则没有找到, 则设置name值为nameArray中的第一个数值
          if (correspondingName === "") {
            console.log('categoryName', categoryName)
            correspondingName = nameArray[0]
          }
          singleTree['name'] = correspondingName
        } else {
          singleTree['name'] = 'root'
        }
        var singleTreeChildren = singleTree.children
        if (typeof (singleTreeChildren) !== 'undefined') {
          for (var sI = 0; sI < singleTreeChildren.length; sI++) {
            var childrenNodeDepth = depth + 1
            inner_add_node_name_to_single_tree(correspondingObj, singleTreeChildren[sI], singleTree['name'], childrenNodeDepth)
          }
        }
      }
    }

    //  得到identifier和name对应的对象
    function get_corresponding_object(unionTree) {
      var correspondingObj = {}
      inner_get_corresponding_object(unionTree, correspondingObj)
      return correspondingObj
      function inner_get_corresponding_object(unionTree, correspondingObj) {
        var categoryName = unionTree['categoryName']
        var name = unionTree['name']
        if (typeof (correspondingObj[categoryName]) === 'undefined') {
          correspondingObj[categoryName] = [name]
        } else {
          correspondingObj[categoryName].push(name)
        }
        var unionChildren = unionTree.children
        if (typeof (unionChildren) !== 'undefined') {
          for (var uI = 0; uI < unionChildren.length; uI++) {
            inner_get_corresponding_object(unionChildren[uI], correspondingObj)
          }
        }
      }
    }

    //  将不符合规则的节点转换为符合规则的模式
    function transform_identifier_to_four_level(nodeId) {
      var nodeIdArray = nodeId.split('_')
      var staticLength = 4
      if (nodeIdArray.length !== staticLength) {
        for (var nI = nodeIdArray.length; nI < staticLength; nI++) {
          nodeIdArray.push("0")
        }
      }
      var identifier = ""
      for (var nI = 0; nI < nodeIdArray.length; nI++) {
        if (identifier === "") {
          identifier = identifier + nodeIdArray[nI]
        } else {
          identifier = identifier + '_' + nodeIdArray[nI]
        }
      }
      return identifier
    }
  }

  //  将对象中的number属性改变成character属性
  function changeObjNameAttr(originalTreeObj) {
    var originalTreeObj = JSON.parse(JSON.stringify(originalTreeObj))
    inner_change_obj_name_attr(originalTreeObj)
    return originalTreeObj
    function inner_change_obj_name_attr(originalTreeObj) {
      if (originalTreeObj.name !== 'root') {
        // originalTreeObj.name = change_number_character(originalTreeObj.name)
        originalTreeObj.name = change_node_name(originalTreeObj.name)
      }
      if (typeof (originalTreeObj.children) !== 'undefined') {
        for (var oI = 0; oI < originalTreeObj.children.length; oI++) {
          inner_change_obj_name_attr(originalTreeObj.children[oI])
        }
      }
    }

    //  将节点的name属性变成由_连接的形式
    function change_node_name(name) {
      var nameArray = name.split('')
      var nameStr = ''
      for (var nI = 0; nI < nameArray.length; nI++) {
        if (nameStr === '') {
          nameStr = nameStr + nameArray[nI]
        } else {
          nameStr = nameStr + '_' + nameArray[nI]
        }
      }
      return nameStr
    }

    //  将number改变成character的类型
    function change_number_character(number) {
      var numberArray = number.split("")
      var idString = ""
      for (var nI = 0; nI < numberArray.length; nI++) {
        var number = +numberArray[nI]
        var character = toLetters(number)
        idString = idString + character
      }
      return idString
    }
  }

  function toLetters(num) {
    "use strict";
    var mod = num % 26;
    var pow = num / 26 | 0;
    var out = String.fromCharCode(65 + num)
    //var out = mod ? String.fromCharCode(64 + num) : (pow--, 'Z');
    return out;
  }

  //  在数据中增加categoryName的属性
  function addCategoryNameToObj(originalTreeObj) {
    var categoryObj = initCategoryObj('DailyRecordTree')
    var depth = 0
    var originalTreeObj = JSON.parse(JSON.stringify(originalTreeObj))
    innerAddCategoryNameToObj(categoryObj, originalTreeObj, depth)
    return originalTreeObj
    function innerAddCategoryNameToObj(categoryObj, originalTreeObj, depth) {
      if (originalTreeObj.name === 'root') {
        originalTreeObj.categoryName = categoryObj['root-0']
      } else {
        var name = originalTreeObj.name
        if (name.length === 1) {
          name = name + '00'
        } else if (name.length === 2) {
          name = name + '0'
        }
        if (typeof (categoryObj[name + '-' + depth]) !== 'undefined') {
          originalTreeObj.name = name
          originalTreeObj.categoryName = categoryObj[name + '-' + depth]
        }
      }
      if (depth === 3) {
        delete originalTreeObj.children
      }
      if (typeof (originalTreeObj.children) !== 'undefined') {
        for (var oI = 0; oI < originalTreeObj.children.length; oI++) {
          innerAddCategoryNameToObj(categoryObj, originalTreeObj.children[oI], depth + 1)
        }
      }
    }
  }

  function initCategoryObj(dataSetName) {
    if (dataSetName != null) {
      categoryObj = require('../data/' + dataSetName + '/categoryName.json')
      categoryNodeArray = linearize(categoryObj)
      categoryIndexObj = {}
      for (var cI = 0; cI < categoryNodeArray.length; cI++) {
        categoryIndexObj[categoryNodeArray[cI][0]] = categoryNodeArray[cI][1]
      }
    }
    return categoryIndexObj

    function linearize(categoryObj) {
      var categoryNodeArray = []
      var depth = 0
      innerLinearize(categoryObj, categoryNodeArray, depth)
      return categoryNodeArray
      function innerLinearize(categoryObj, categoryNodeArray, depth) {
        var nodeCategory = null
        var nodeCategoryName = null
        if (categoryObj.category !== 'root') {
          nodeCategory = categoryObj.category.substring(0, 3) + '-' + depth
          nodeCategoryName = categoryObj.category.substring(4, categoryObj.category.length)
        } else {
          nodeCategory = 'root-' + depth
          nodeCategoryName = 'root'
        }
        var singleCategoryNode = [nodeCategory, nodeCategoryName]
        categoryNodeArray.push(singleCategoryNode)
        if (typeof(categoryObj.children) !== 'undefined') {
          depth = depth + 1
          for (var cI = 0; cI < categoryObj.children.length; cI++) {
            innerLinearize(categoryObj.children[cI], categoryNodeArray, depth)
          }
        }
      }
    }
  }

  function addCategoryName(treeNodeArrayObj, dataSetName) {
    if (categoryIndexObj == null) {
      categoryIndexObj = initCategoryObj(dataSetName)
    }
    for (var item in treeNodeArrayObj) {
      var treeNodeArray = treeNodeArrayObj[item]
      addCategoryToTreeNodeArray(treeNodeArray, categoryIndexObj)
    }
    return treeNodeArrayObj
  }

  //  向一个数组中的对象中增加categoryName的属性
  function addCategoryToTreeNodeArray(treeNodeArray, categoryIndexObj) {
    for (var tI = 0; tI < treeNodeArray.length; tI++) {
      var treeNodeIndex = treeNodeArray[tI].category + '-' + treeNodeArray[tI].depth
      var categoryName = categoryIndexObj[treeNodeIndex]
      treeNodeArray[tI].categoryName = categoryName
    }
  }

  function handleStart(path, response, next) {
    // logger.log("    Handler: Start!");
    response.status(200).type('html').sendFile('/client' + path + '/index.html', resOpt,
      function (err) {
        if (err) {
          logger.log(err)
          response.status(err.status).end()
        }
        next()
      })
  }

  function handleFile(path, response, next) {
    if (typeof handle[path] === 'function') {
      next()
      return
    }
    // logger.log("    Handler: File!");
    var t_index = path.lastIndexOf('.') + 1
    var t_path = path.slice(t_index)
    var tt_path = '/client' + path
    // logger.log("                                                 " + tt_path)
    response.status(200).type(fileType[t_path]).sendFile(tt_path.slice(1), resOpt,
      function (err) {
        if (err) {
          logger.log(err)
          response.status(err.status).end()
        }
        next()
      })
  }

  function handleQuery(request, response) {
    logger.log("    Handler: Query!");
    var t_record = request.url.replace("/query?name=", "");
    var responseFunc = function (v_result) {
      if (!v_result) {
        logger.log("    Handler: Query Failed!");
        response.sendStatus(404);
      } else {
        logger.log("    Handler: Query Success! The result is " + v_result)
        response.status(200).jsonp(v_result);
      }
    };
    db.query(t_record, responseFunc);
  }

  function handle404(path, response, next) {
    logger.log('    Handler: File not found for ' + path)
    response.sendStatus(404)
    next()
  }

  function handleFileName(request, response) {
    var sampleDataName = request.body.DataSetName
    dataSetName = sampleDataName
    var fileNameJson = clone(require('../data/' + sampleDataName + '/filesName.json'))

    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.send(JSON.stringify(fileNameJson, null, 3))
  }

  /**
   * 传递要计算并集的树的id数组, 以及dataSetName, barcodeHeight, barcodeWidth等信息, 返回树的节点数组
   */
  function handleAndOperationData(request, response) {
    var reqBody = request.body
    var dataSetName = reqBody.dataSetName
    var dataItemNameArray = reqBody['dataItemNameArray']
    var dataItemType = typeof(dataItemNameArray)
    var selectedLevels = reqBody['selectedLevels']
    var barcodeWidthArray = reqBody['barcodeWidthArray']
    var barcodeHeight = reqBody['barcodeHeight']
    var compactNum = reqBody['compactNum']
    var maxDepth = reqBody['maxDepth']
    var groupId = reqBody['groupId']
    var barcodeNodeInterval = +reqBody['barcodeNodeInterval']
    //  将barcodeWidth的数组内部的元素转换为数字
    for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
      barcodeWidthArray[bI] = +barcodeWidthArray[bI]
    }
    var selectedLevelStr = ''
    //  将selectedLevels的数组内部的元素转换为数字
    if (typeof(selectedLevels) === 'undefined') {
      selectedLevels = []
    }
    for (var sI = 0; sI < selectedLevels.length; sI++) {
      selectedLevels[sI] = +selectedLevels[sI]
      selectedLevelStr = selectedLevelStr + selectedLevels[sI]
    }
    var superTreeObj = get_super_tree_obj(dataItemNameArray, dataSetName)
    var superTreeNodeArray = innerHandleAndOperationTreeNodeObj(groupId, superTreeObj, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
    var compactTreeNodeArrayObj = innerHandleAndOperationCompactTreeNodeObj(groupId, superTreeObj, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval, dataSetName)
    var categoryNodeObjWithLocArray = linearize2NodeArray(categoryObj, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
    sendTreeNodeArray(superTreeNodeArray, compactTreeNodeArrayObj, categoryNodeObjWithLocArray)
    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeNodeArray, compactTreeNodeArrayObj, categoryNodeObjWithLocArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {
        'barcodeNodeAttrArray': treeNodeArray,
        'compactTreeNodeArrayObj': compactTreeNodeArrayObj,
        'categoryNodeObjArray': categoryNodeObjWithLocArray
      }
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  /**
   *  计算superTree
   */
  function get_super_tree_obj(dataItemNameArray, dataSetName) {
    var dataItemType = typeof(dataItemNameArray)
    if (dataItemType === 'string') {
      dataItemNameArray = [dataItemNameArray]
    }
    var superTreeObj = null
    var filePath = '../data/' + dataSetName + '/originalData/'
    for (var fI = 0; fI < dataItemNameArray.length; fI++) {
      var dataItemName = dataItemNameArray[fI]
      var fileName = dataItemName + '.json'
      var originalTreeObj = clone(require(filePath + fileName))
      var cloneOriginalTreeObj = JSON.parse(JSON.stringify(originalTreeObj))
      superTreeObj = dataProcessor.mergeTwoTreeObj(superTreeObj, cloneOriginalTreeObj)
    }
    return superTreeObj
  }

  /**
   * 传递树的id数组, 以及dataSetName, barcodeHeight, barcodeWidth等信息, 返回树的节点数组
   * 点击histogram上面的每一个柱状图时, 调用这个方法, 读取原始的数据进行显示
   */

  /**
   * 计算交集的compact树的节点集合
   */
  function innerHandleAndOperationCompactTreeNodeObj(groupId, superTreeObj, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval, dataSetName) {
    var treeNodeArrayObj = readAndCompactTreeNodeObj(superTreeObj, groupId, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval)
    addCompactCategoryName(treeNodeArrayObj, dataSetName)
    return treeNodeArrayObj
  }

  /**
   * 计算交集的树的节点集合
   */
  function innerHandleAndOperationTreeNodeObj(groupId, superTreeObj, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval) {
    if (categoryIndexObj == null) {
      categoryIndexObj = initCategoryObj(dataSetName)
    }
    var superTreeNodeArray = readAndTreeNodeObj(superTreeObj, groupId, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
    addCategoryToTreeNodeArray(superTreeNodeArray, categoryIndexObj)
    return superTreeNodeArray
  }


  /**
   *
   */
  function innerHandleCompactTreeNodeObj(dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval) {
    var treeNodeArrayObj = readCompactTreeNodeObj(dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval)
    addCompactCategoryName(treeNodeArrayObj, dataSetName)
    return treeNodeArrayObj
  }

  //  将category对象转换为category的节点数组
  function linearize2NodeArray(categoryObj, barcodeWidthArray, barcodeHeight, barcodeNodeInterval) {
    var categoryNodeAttrArray = []
    var categoryNodeWithLocArray = []
    var depth = 0
    innerLinearize2NodeArray(categoryObj, categoryNodeAttrArray, depth)
    var xLoc = 0
    for (var cI = 0; cI < categoryNodeAttrArray.length; cI++) {
      var nodeCategory = categoryNodeAttrArray[cI][0]
      var nodeCategoryName = categoryNodeAttrArray[cI][1]
      var depth = categoryNodeAttrArray[cI][2]
      var nodeWidth = barcodeWidthArray[depth]
      var nodeItemObj = {
        'id': nodeCategory,
        'category': nodeCategory,
        'categoryName': nodeCategoryName,
        'depth': depth,
        'x': xLoc,
        'y': 0,
        'width': nodeWidth,
        'height': barcodeHeight,
        'existed': false
      }
      categoryNodeWithLocArray.push(nodeItemObj)
      xLoc = xLoc + nodeWidth + barcodeNodeInterval
    }
    return categoryNodeWithLocArray
    function innerLinearize2NodeArray(categoryObj, categoryNodeAttrArray, depth) {
      var nodeCategory = null
      var nodeCategoryName = null
      if (categoryObj.category !== 'root') {
        nodeCategory = 'node-' + depth + '-' + categoryObj.category.substring(0, 3)
        nodeCategoryName = categoryObj.category.substring(4, categoryObj.category.length)
      } else {
        nodeCategory = 'node-' + depth + '-root'
        nodeCategoryName = 'root'
      }
      var singleCategoryNodeName = [nodeCategory, nodeCategoryName, depth]
      categoryNodeAttrArray.push(singleCategoryNodeName)
      if (typeof(categoryObj.children) !== 'undefined') {
        depth = depth + 1
        for (var cI = 0; cI < categoryObj.children.length; cI++) {
          innerLinearize2NodeArray(categoryObj.children[cI], categoryNodeAttrArray, depth)
        }
      }
    }
  }

  /**
   *  处理BarcodeTree压缩形式
   */
  function handleCompactData(request, response) {
    var reqBody = request.body
    var dataSetName = reqBody.dataSetName
    var dataItemNameArray = reqBody['dataItemNameArray']
    var dataItemType = typeof(dataItemNameArray)
    var selectedLevels = reqBody['selectedLevels']
    var barcodeWidthArray = reqBody['barcodeWidthArray']
    var barcodeHeight = reqBody['barcodeHeight']
    var compactNum = reqBody['compactNum']
    var maxDepth = reqBody['maxDepth']
    //  将barcodeWidth的数组内部的元素转换为数字
    for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
      barcodeWidthArray[bI] = +barcodeWidthArray[bI]
    }
    var selectedLevelStr = ''
    //  将selectedLevels的数组内部的元素转换为数字
    if (typeof(selectedLevels) === 'undefined') {
      selectedLevels = []
    }
    for (var sI = 0; sI < selectedLevels.length; sI++) {
      selectedLevels[sI] = +selectedLevels[sI]
      selectedLevelStr = selectedLevelStr + selectedLevels[sI]
    }
    var compactTreeNodeArrayObj = innerHandleCompactTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth)
    innerHandleOriginalTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight)
    var categoryNodeObjArray = linearize2NodeArray(categoryObj, barcodeWidthArray)
    sendTreeNodeArray(compactTreeNodeArrayObj, categoryNodeObjArray)

    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeNodeArray, categoryNodeObjArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {'treeNodeObject': treeNodeArray, 'categoryNodeObjArray': categoryNodeObjArray}
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  /**
   *
   */
  function addCompactCategoryName(treeNodeArrayObj, dataSetName) {
    for (var item in treeNodeArrayObj) {
      if (item !== 'treeNodeObj') {
        addCategoryName(treeNodeArrayObj[item], dataSetName)
      }
    }
  }

  /**
   * 1. 从文件中读取tree object对象
   * 2. 将treeObject对象进行线性化转换成treeNodeArray数组
   * 3. 对于数组中的treeObject计算并集
   */
  function readAndTreeNodeObj(superTreeObj, groupId, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval) {
    var dataItemNameWithOptions = groupId + selectedLevelStr
    existedFileObj[dataItemNameWithOptions] = {}
    existedFileObj[dataItemNameWithOptions]['originalTreeObj'] = superTreeObj
    var superTreeNodeArray = dataProcessor.loadOriginalSingleData(superTreeObj, barcodeWidthArray, existedFileObj[dataItemNameWithOptions], selectedLevels, barcodeHeight, barcodeNodeInterval)
    return superTreeNodeArray
  }

  /**
   * 1. 从文件中读取tree object对象 2. 将treeObject对象进行线性化转换成treeNodeArray数组
   */
  function readCompactTreeNodeObj(originalTreeObjObject, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval) {
    var treeNodeArrayObj = {}
    // for (var item in originalTreeObjObject) {
    //   var originalTreeObj = clone(originalTreeObjObject[item])
    //
    // }
    for (var fI = 0; fI < fileNameArray.length; fI++) {
      var dataItemName = fileNameArray[fI]
      var dataItemNameWithOptions = dataItemName + compactSelectedLevelStr
      var fileName = dataItemName + '.json'
      // if (typeof (existedFileObj[dataItemNameWithOptions]) === 'undefined') {
      existedFileObj[dataItemNameWithOptions] = {}
      var originalTreeObj = clone(require(filePath + fileName))
      existedFileObj[dataItemNameWithOptions]['originalTreeObj'] = originalTreeObj
      dataProcessor.loadCompactSingleData(originalTreeObj, barcodeWidthArray, existedFileObj[dataItemNameWithOptions], selectedLevels, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval)
      treeNodeArrayObj[dataItemName] = getTreeNodeArrayObj(existedFileObj[dataItemNameWithOptions])
      // } else {
      //   treeNodeArrayObj[dataItemName] = getTreeNodeArrayObj(existedFileObj[dataItemNameWithOptions])
      // }
    }
    return treeNodeArrayObj
    /**
     * 返回treeNodeArrayObj只是保留compactTreeNodeLocArray
     * @param existedFileObj
     * {
     *  originalTreeObj: { num: 106, name: 'root', children: [Object], depth: 0 },
     *  'compact-level-3': { compactTreeNodeArray: [Object],
     *   compactTreeNodeObj: [Object],
     *   compactTreeNodeLocArray: [Object] } }
     * }
     * @returns {{}}
     */
    function getTreeNodeArrayObj(existedFileObj) {
      var treeNodeArrayObj = {}
      for (var item in existedFileObj) {
        if ((item !== 'originalTreeObj') && (item !== 'treeNodeObj')) {
          treeNodeArrayObj[item] = existedFileObj[item].compactTreeNodeLocArray
        }
      }
      return treeNodeArrayObj
    }
  }

  function readAndCompactTreeNodeObj(supertreeObj, groupId, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval) {
    var compactSelectedLevelStr = 'compact-' + selectedLevelStr
    var dataItemNameWithOptions = groupId + compactSelectedLevelStr
    existedFileObj[dataItemNameWithOptions] = {}
    existedFileObj[dataItemNameWithOptions]['originalTreeObj'] = supertreeObj
    dataProcessor.loadCompactSingleData(supertreeObj, barcodeWidthArray, existedFileObj[dataItemNameWithOptions], selectedLevels, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval)
    var treeNodeArrayObj = getTreeNodeArrayObj(existedFileObj[dataItemNameWithOptions])
    return treeNodeArrayObj
    /**
     * 返回treeNodeArrayObj只是保留compactTreeNodeLocArray
     * @param existedFileObj
     * {
     *  originalTreeObj: { num: 106, name: 'root', children: [Object], depth: 0 },
     *  'compact-level-3': { compactTreeNodeArray: [Object],
     *   compactTreeNodeObj: [Object],
     *   compactTreeNodeLocArray: [Object] } }
     * }
     * @returns {{}}
     */
    function getTreeNodeArrayObj(existedFileObj) {
      var treeNodeArrayObj = {}
      for (var item in existedFileObj) {
        if ((item !== 'originalTreeObj') && (item !== 'treeNodeObj')) {
          treeNodeArrayObj[item] = existedFileObj[item].compactTreeNodeLocArray
        }
      }
      return treeNodeArrayObj
    }
  }

  /**
   * 根据传递的rootId得到现存的原始的树的子树的节点数组
   */
  function removeSuperTree(request, response) {
    var reqBody = request.body
    var dataItemNameArray = reqBody['dataItemNameArray']
    var dataItemType = typeof(dataItemNameArray)
    var dataSetName = reqBody.dataSetName
    var selectedLevels = reqBody['selectedLevels']
    var barcodeWidthArray = reqBody['barcodeWidthArray']
    var barcodeHeight = reqBody['barcodeHeight']
    var rootId = reqBody.rootId
    var rootLevel = reqBody.rootLevel
    var compactNum = reqBody.compactNum
    var maxDepth = reqBody['maxDepth']
    //  将barcodeWidth的数组内部的元素转换为数字
    for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
      barcodeWidthArray[bI] = +barcodeWidthArray[bI]
    }
    var selectedLevelStr = ''
    //  将selectedLevels的数组内部的元素转换为数字
    if (typeof(selectedLevels) === 'undefined') {
      selectedLevels = []
    }
    for (var sI = 0; sI < selectedLevels.length; sI++) {
      selectedLevels[sI] = +selectedLevels[sI]
      selectedLevelStr = selectedLevelStr + selectedLevels[sI]
    }
    var treeNodeArrayObj = innerHandleOriginalTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight)
    var compactTreeNodeArrayObj = innerHandleCompactTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth)
    var remainedSubtreeNodeArrayObj = getRemainedOriginalTreeNodeObj(treeNodeArrayObj, rootId, rootLevel)
    var remainedCompactTreeNodeArrayObj = getRemainedCompactTreeNodeObj(compactTreeNodeArrayObj, rootId, rootLevel)
    sendTreeNodeArray(remainedSubtreeNodeArrayObj, remainedCompactTreeNodeArrayObj)
    //  获得一个原始模式下的子树的节点数组
    function getRemainedOriginalTreeNodeObj(treeNodeArrayObj, rootId, rootLevel) {
      var remainedTreeNodeArrayObj = {}
      rootLevel = +rootLevel
      for (var item in treeNodeArrayObj) {
        var treeNodeArray = treeNodeArrayObj[item]
        //  计算subtree的begin值
        var remainedBegin = 0
        for (var tI = 0; tI < treeNodeArray.length; tI++) {
          if (treeNodeArray[tI].id === rootId) {
            remainedBegin = tI
            break
          }
        }
        //  计算subtree的end值
        var remainedEnd = 0
        for (var rI = (remainedBegin + 1); rI < treeNodeArray.length; rI++) {
          var nodeDepth = +treeNodeArray[rI].depth
          if (nodeDepth <= rootLevel) {
            remainedEnd = rI - 1
            break
          }
        }
        remainedTreeNodeArrayObj[item] = treeNodeArray.slice(remainedBegin, remainedEnd)
      }
      return remainedTreeNodeArrayObj
    }

    //  获得一个compact模式下的子树的节点数组
    function getRemainedCompactTreeNodeObj(treeNodeArrayObj, rootId, rootLevel) {
      var remainedTreeNodeArrayObj = {}
      rootLevel = +rootLevel
      for (var treeItem in treeNodeArrayObj) {
        var treeObj = treeNodeArrayObj[treeItem]
        remainedTreeNodeArrayObj[treeItem] = {}
        for (var levelItem in treeObj) {
          var treeNodeArray = treeObj[levelItem]
          //  计算subtree的begin值
          var remainedBegin = 0
          for (var tI = 0; tI < treeNodeArray.length; tI++) {
            if (treeNodeArray[tI].id === rootId) {
              remainedBegin = tI
              break
            }
          }
          //  计算subtree的end值
          var remainedEnd = 0
          for (var rI = (remainedBegin + 1); rI < treeNodeArray.length; rI++) {
            var nodeDepth = +treeNodeArray[rI].depth
            if (nodeDepth <= rootLevel) {
              remainedEnd = rI - 1
              break
            }
          }
          remainedTreeNodeArrayObj[treeItem][levelItem] = treeNodeArray.slice(remainedBegin, remainedEnd)
        }
      }
      return remainedTreeNodeArrayObj
    }

    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeNodeArray, compactTreeNodeArrayObj) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {
        'treeNodeObject': treeNodeArray,
        'compactTreeNodeArrayObj': compactTreeNodeArrayObj,
      }
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  /**
   * 根据传入的rootId构建unionTree
   * @param request
   * @param response
   */
  function handleBuildSuperTree(request, response) {
  }

  function handleTreeObjToNodeList(request, response) {
    var reqBody = request.body
    var treeObjArray = reqBody["treeObjArray"]
    var rootId = reqBody.rootId
    var rootLevel = reqBody.rootLevel
    var alignedLevel = reqBody.alignedLevel
    var dataSetName = reqBody.dataSetName
    var treeNodeArrayObj = {}
    var barcodeWidthArray = reqBody['barcodeWidthArray']
    var barcodeHeight = reqBody['barcodeHeight']
    //  将barcodeWidth的数组内部的元素转换为数字
    for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
      barcodeWidthArray[bI] = +barcodeWidthArray[bI]
    }
    var selectedLevels = reqBody['selectedLevels']
    for (var sI = 0; sI < selectedLevels.length; sI++) {
      selectedLevels[sI] = +selectedLevels[sI]
    }
    var superTreeNodeArray = dataProcessor.getSuperTreeNodeFromTreeObjArray(treeObjArray, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel)
    addCategoryName(superTreeNodeArray, dataSetName)
    sendTreeNodeArray(superTreeNodeArray)

    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeNodeArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {'treeNodeObject': treeNodeArray}
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  function handleTreeNodeIdArray(request, response) {
    var reqBody = request.body
    var treeObjArray = reqBody['treeObjArray']
    var treeObjectIdArray = dataProcessor.getTreeObjectIdArray(treeObjArray)
    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeObjectIdArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {'treeObjectIdArray': treeObjectIdArray}
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  function handleCategoryName(request, response) {
    var reqBody = request.body
    var sampleDataName = reqBody.DataSetName
    var filePath = '../data/' + sampleDataName + '/categoryName.json'
    var categoryObj = clone(require(filePath))
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.send(JSON.stringify(categoryObj, null, 3))
  }

  var handle = {}
  handle['/'] = handleStart
  handle['/start'] = handleStart
  handle['404'] = handle404
  handle['file'] = handleFile
  handle['query'] = handleQuery
  handle['/file_name'] = handlerObj['/file_name']
  handle['/barcode_original_data'] = handlerObj['/barcode_original_data']
  handle['/barcode_compact_data'] = handlerObj['/barcode_compact_data']
  handle['/and_operation_result'] = handlerObj['/and_operation_result']
  handle['/or_operation_result'] = handlerObj['/or_operation_result']
  handle['/complement_operation_result'] = handlerObj['/complement_operation_result']
  handle['/build_super_tree'] = handlerObj['/build_super_tree']
  handle['/remove_from_super_tree'] = handlerObj['/remove_from_super_tree']
  handle['/update_barcode_tree_sequence'] = handlerObj['/update_barcode_tree_sequence']
  handle['/update_barcode_tree_vertical_sequence'] = handlerObj['/update_barcode_tree_vertical_sequence']
  handle['/remove_super_tree'] = removeSuperTree
  handle['/treeobject_to_nodelist'] = handleTreeObjToNodeList
  handle['/category_name'] = handleCategoryName
  return handle
}

exports.initialize = initialize