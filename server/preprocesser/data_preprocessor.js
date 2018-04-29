var fs = require('fs')

/**
 *  对于图书馆数据的预处理函数
 */
function pre_process_record_tree() {
  var DATASET_NAME = "DailyRecordTree"
  //  将num_to_character_preprocess传入到preprocess函数中作为参数
  preprocess(DATASET_NAME, num_to_character_preprocess)
}

/**
 *  对于recordTree数据的预处理函数
 */
function preprocess(DATASET_NAME, num_to_character_preprocess) {
  var filePath = './server/data/' + DATASET_NAME + '/rawData/'
  fs.readdir(filePath, function (err, files) {
    if (err) {
      console.log('err', err)
    }
    var fileSumNum = 0
    files.forEach(function (f) {
      if (f !== '.DS_Store') {
        fileSumNum = fileSumNum + 1
      }
    })
    var fileIndex = 0
    //  写文件是异步的, 所以需要先完成第一步, 才能够执行第二步
    files.forEach(function (f) {
      if (f !== '.DS_Store') {
        var originalTreeObj = require('../data/' + DATASET_NAME + '/rawData/' + f)
        var originalTreeObj1 = addCategoryNameToObj(originalTreeObj, DATASET_NAME)
        fs.writeFile(('./server/data/' + DATASET_NAME + '/originalData/' + f), JSON.stringify(originalTreeObj1), 'utf8', function (err) {
          if (err) {
            console.log('err', err)
          }
          fileIndex = fileIndex + 1
          if (fileIndex === fileSumNum) {
            num_to_character_preprocess(DATASET_NAME)
          }
        })
      }
    })
  })
}

/**
 *  对于recordTree的预处理函数
 */
function num_to_character_preprocess(DATASET_NAME) {
  console.log('begin num_to_character_preprocess')
  var filePath = './server/data/' + DATASET_NAME + '/originalData/'
  fs.readdir(filePath, function (err, files) {
    if (err) {
      console.log('err', err)
    }
    files.forEach(function (f) {
      if (f !== '.DS_Store') {
        var originalTreeObj = require('../data/' + DATASET_NAME + '/originalData/' + f)
        var originalTreeObj1 = changeObjNameAttr(originalTreeObj)
        fs.writeFile(('./server/data/' + DATASET_NAME + '/originalData/' + f), JSON.stringify(originalTreeObj1), 'utf8', function (err) {
          if (err) {
            console.log('err', err)
          }
        });
      }
    });
  })
}

/**
 * 在数据中增加categoryName的属性
 */
function addCategoryNameToObj(originalTreeObj, DATASET_NAME) {
  var categoryObj = initCategoryObj(DATASET_NAME)
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
      for (var cI = 0; cI < originalTreeObj.children.length; cI++) {
        originalTreeObj.children[cI].name = originalTreeObj.children[cI].name + '-' + originalTreeObj.name + '-' + cI
      }
    }
    if (typeof (originalTreeObj.children) !== 'undefined') {
      for (var oI = 0; oI < originalTreeObj.children.length; oI++) {
        innerAddCategoryNameToObj(categoryObj, originalTreeObj.children[oI], depth + 1)
      }
    }
  }
}

/**
 * 初始化category对象
 */
function initCategoryObj(dataSetName) {
  if (dataSetName != null) {
    var categoryObj = require('../data/' + dataSetName + '/categoryName.json')
    var categoryNodeArray = linearize(categoryObj)
    var categoryIndexObj = {}
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

/**
 * 将对象中的number属性改变成character属性
 */
function changeObjNameAttr(originalTreeObj) {
  var originalTreeObj = JSON.parse(JSON.stringify(originalTreeObj))
  inner_change_obj_name_attr(originalTreeObj)
  return originalTreeObj
  function inner_change_obj_name_attr(originalTreeObj) {
    if (originalTreeObj.name !== 'root') {
      if (originalTreeObj.name.length === 3) {
        originalTreeObj.name = change_node_name(originalTreeObj.name)
      }
    }
    if (typeof (originalTreeObj.children) !== 'undefined') {
      for (var oI = 0; oI < originalTreeObj.children.length; oI++) {
        inner_change_obj_name_attr(originalTreeObj.children[oI])
      }
    }
  }

  /**
   *  将节点的name属性变成由_连接的形式, 因为在某些情况下可能子树的数量超过10,
   *  那么如果还是使用传统的数字, 那么就无法判断每一层的子树index值
   */
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
}

//  ************************************************************************************************
/**
 *  执行对于NBAdata的预处理函数NBA_preprocess时, 需要在originalData文件夹中改变文件名称为1946 - 2017.json
 *
 *  预处理函数读取的是/server/data/NBATeamTree/rawData文件夹中的数据
 *  然后输出的是
 */
function pre_process_nba_tree() {
  var DATASET_NAME = "NBATeamTree"
  NBA_preprocess(DATASET_NAME)
}

/**
 *  对于NBA数据的预处理函数, 预处理函数的输入是在数据文件夹下的raw data, 输出是在数据文件夹下的originalData
 */
function NBA_preprocess(DATASET_NAME) {
  var filePath = './server/data/' + DATASET_NAME + '/rawData/'
  fs.readdir(filePath, function (err, files) {
    if (err) {
      console.log('err', err)
    }
    var regularFormTreeArray = []
    files.forEach(function (f) {
      if (f !== '.DS_Store') {
        var originalTreeObj = require('../data/' + DATASET_NAME + '/rawData/' + f)
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
        // fs.writeFile(('./server/data/NBATeamTree/originalData/' + f), JSON.stringify(regularFormDataObj), 'utf8', function (err) {
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
    write_file_obj(DATASET_NAME, regularFormTreeArray)
    fs.writeFile(('./server/data/' + DATASET_NAME + '/unionTree.json'), JSON.stringify(unionTree), 'utf8', function (err) {
      if (err) {
        console.log('err', err)
      }
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
      fs.writeFile(('./server/data/' + dataFileName + '/originalData/' + thisFileName), JSON.stringify(regularFormDataObj), 'utf8', function (err) {
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
    //  TODO 不要删除, 这部分是存储名称与节点的id对应的对象
    // fs.writeFile(('./server/data/' + DATASET_NAME + '/originalData/correspondingObj.json'), JSON.stringify(correspondingObj), 'utf8', function (err) {
    //   if (err) {
    //     console.log('err', err)
    //   }
    // })
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

/**
 *  目前预处理两个数据集,
 *  1. 图书馆记录数据, 使用pre_process_record_tree处理
 *  2. NBA数据, 使用pre_process_nba_tree处理
 */
exports.pre_process_nba_tree = pre_process_nba_tree
exports.pre_process_record_tree = pre_process_record_tree
