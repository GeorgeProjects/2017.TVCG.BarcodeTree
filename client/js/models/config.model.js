/**
 * Created by Guozheng Li 2017/2/10
 */
define([
  'require',
  'marionette',
  'underscore',
  'backbone'
], function (require, Mn, _, Backbone) {
  'use strict'
  window.Config = new (Backbone.Model.extend({
    defaults: {
      'NULL_SELECTION': -1,
      'DataSetCollection': {
        'LibraryTree_DailyName': 'DailyRecordTree',
        'NBATeamTreeName': 'NBATeamTree',
        'LibraryRecordTree': 'LibraryRecordTree',
        //
        'LibraryTree_Name': 'RecordTree',
        'SignalTree_Name': 'SignalTree',
        'RepostingTree_Name': 'RepostingTree',
        'PhylogeneticTree_Name': 'PhylogeneticTree',
        'DirectoryTree_Name': 'DirectoryTree'
      },
      MISSED_NODE_CLASS: {
        MISS_NODE_HIGHLIGHT: 'missed-node-highlight',
        MISS_NODE_HIGHLIGHT_MIN_STROKE: 'missed-node-highlight_min-stroke',
        MISS_NODE_HIGHLIGHT_MAX_STROKE: 'missed-node-highlight_max-stroke'
      },
      GENERAL_MISSED_NODE_CLASS: {
        MISS_NODE_HIGHLIGHT: 'node-missed',
        MISS_NODE_HIGHLIGHT_MIN_STROKE: 'node-missed_min-stroke',
        MISS_NODE_HIGHLIGHT_MAX_STROKE: 'node-missed_max-stroke'
      },
      BARCODETREE_VIEW_SETTING: {
        ICON_WAIT_DURATION: 1000,// 需要将barcode变换完成之后再绘制icon, 所以时间是需要比bar
        COMPARISON_RESULT_PADDING: 50,
        BARCODE_NODE_PADDING_LENGTH: 40
      },
      BARCODETREE_STATE: {
        BARCODETREE_NODE_SELECTION: 'NODE',// 需要将barcode变换完成之后再绘制icon, 所以时间是需要比bar
        BARCODETREE_SUBTREE_SELECTION: 'SUBTREE',
        BARCODETREE_DATE_SORT: 'DATE',
        BARCODETREE_DAY_SORT: 'DAY',
        BARCODETREE_NODENUMBER_SORT: 'NODENUMBER',
        BARCODETREE_ATTRIBUTE_SORT: 'ATTRIBUTE',
        BARCODETREE_SIMILARITY_SORT: 'SIMILARITY',
      },
      BARCODETREE_MODEL_SETTING: {
        ALIGN_START: 'aligned-start',
        ALIGN_RANGE: 'aligned-range',
        PADDING_RANGE: 'padding-range',
        PADDING_BEGIN: 'padding-begin'
      },
      BARCODETREE_COMPARISON_MODE: {
        ATTRIBUTE: 'ATTRIBUTE',
        TOPOLOGY: 'TOPOLOGY'
      },
      BARCODETREE_TOOLTIP_ENABLE: true,
      //  展示barcode的不同状态, 包括原始状态, compact状态, global的状态
      'CONSTANT': {
        'ORIGINAL': 'ORIGINAL',
        'COMPACT': 'COMPACT',
        'GLOBAL': 'GLOBAL',
        'UNION': 'UNION',
        'FISHEYE': 'FISHEYE',
        'ABSOLUTE_COMPACT_FATHER': 'ABSOLUTE_COMPACT_FATHER',
        'ABSOLUTE_COMPACT_CHILDREN': 'ABSOLUTE_COMPACT_CHILDREN',
        'TEMPLATE': 'TEMPLATE',
        //  barcode tree中选择的不同状态
        'NODE': 'NODE',
        'SUBTREE': 'SUBTREE',
        'NOT_SELECTED': 'NOT_SELECTED',
        'UN_SELECTION': 'UN_SELECTION',
        'NODE_SELECTION': 'NODE',
        'NULL_SELECTION': 'NULL',
        'SUBTREE_SELECTION': 'SUBTREE'
      },
      'BARCODE_COLOR': {
        'ROOT_COLOR': '#000000',
        'LEAF_COLOR': '#DCDCDC',
        'ADD_NODE_COLOR': '#a1d76a',
        'MISS_NODE_COLOR': '#e9a3c9',
        'SAME_NODE_COLOR': 'black'
      },
      'TABLE_LENS_PARA': {
        'minimum_ratio': 0.25,
        //  希望category的obj距离右边界存在一定的距离
        'category_padding_right': 5
      },
      'BARCODE_MODE': {
        'OriginalMode': 'original',
        'CompactMode': 'compact'
      },
      'SUPERTREE_MODE': {
        'WholeTreeMode': 'TheWholeTree',
        'SuperTreeMode': 'TheSuperTree'
      },
      'EXPAND_COMPRESS_MODE': {
        'EXPAND_MODE': 'ExpandMode',
        'COMPRESS_MODE': 'CompressMode'
      },
      'EVENTS': {
        //  更新barcode的参数值
        'UPDATE_BARCODE_PARAMETERS': 'update-barcode-parameters',
        'UPDATE_SELECTED_LEVELS': 'update-selected-levels',
        //*******************************************
        //  向barcode节点中增加locked aligned的class
        'ADD_LOCKED_ALIGN_CLASS': 'add-locked-align-class',
        //  删除barcode节点中的locked aligned的class
        'REMOVE_LOCKED_ALIGN_CLASS': 'remove-locked-align-class',
        // ====================================================================
        //  设置选择的颜色
        'SET_PRECLICK_COLOR': 'set-preclick-color',
        //  更新刷选范围的distribution柱状图的信号
        'UPDATE_BRUSH_DISTRIBUTION_VIEW': 'update-brush-distribution-view',
        //  更新distribution的信号
        'UPDATE_DISTRIBUTION_VIEW': 'update-distribution-view',
        'UPDATE_FILTERING_HIGHLIGHT_NODES': 'update-filtering-highlight-nodes',
        //  更新barcode视图的宽度
        'UPDATE_BARCODE_VIEW_WIDTH': 'update-barcode-view-width',
        //  在barcodeComparison视图中删除一个barcodeTree
        'REMOVE_SELECTION': 'remove-selection',
        //  开始渲染barcode视图
        // 'BEGIN_RENDER_BARCODE_VIEW': 'begin-render-barcode-view',
        //***************************
        //  清空选中视图中的所有元素
        'CLEAR_ALL': 'clear-all',
        //***************************
        //  在barcodeView上发出的信号
        //  打开superTree panel视图
        'OPEN_SUPER_TREE': 'open-super-tree',
        //  关闭supertree panel视图
        'CLOSE_SUPER_TREE': 'close-super-tree',
        //***************************
        // superTree视图上的信号
        //  在superTree视图中鼠标放在上方的节点上
        'HIGHLIGHT_ALL_RELATED_NODE': 'highlight-all-related-node',
        //  在superTree视图中鼠标点击选择的节点
        'HIGHLIGHT_ALL_SELECTED_NODE_SUPERTREEVIEW': 'highlight-all-selected-node',
        //  取消在单个视图上的高亮效果
        'NODE_MOUSEOUT': 'node-mouseout',
        //***************************
        // barcode.collection视图上发出的信号
        //  隐藏loading的标志
        'HIDE_LOADING_ICON': 'hide-loading-icon',
        //  更新superTree视图中的aligned icon
        'UPDATE_ALIGNED_ICON': 'update-aligned-icon',
        //***************************
        //  barcode.single视图上发出的信号
        //  渲染覆盖在barcode的上面的带有斜纹的矩形
        //  支持lasso的功能的信号
        'ENABLE_LASSO_FUNCTION': 'enable-lasso-function',
        //  高亮相关的节点
        'HIGH_RELATED_NODES': 'highlight-related-nodes',
        //  在barcodeview里点击选中的barcode取消选中barcode
        'UNSELECT_BARCODE_EVENT': 'unselect-barcode',
        //  在barcodeview里点击未选中的barcode选中barcode
        'SELECT_BARCODE_EVENT': 'select-barcode',
        //  在barcodeview里点击选中的barcode选中取消barcode进行集合操作
        'SET_UNSELECT_BARCODE_EVENT': 'set-unselect-barcode-event',
        //  在barcodeview里点击未选中的barcode选中barcode进行集合操作
        'SET_SELECT_BARCODE_EVENT': 'set-select-barcode-event',
        //  鼠标从某个barcode上面移开广播的事件
        'UN_HOVERING_BARCODE_EVENT': 'unhovering-barcode',
        //  鼠标悬浮在某个barcode上面广播的事件
        'HOVERING_BARCODE_EVENT': 'hovering-barcode',
        //  更新barcode的配置视图
        'UPDATE_TREE_CONFIG_VIEW': 'update-tree-config-view',
        //  删除总结的柱状图
        'REMOVE_SUMMARY_STATE': 'remove-summary-state',
        //  展示总结的柱状图
        'SHOW_SUMMARY_STATE': 'show-summary-state',
        //***************************
        //  从barcode comparison视图中发出的信号
        'HIGHLIGHT_LASSO_SELECTED': 'highlight-lasso-selected',
        'UNHIGHLIGHT_LASSO_SELECTED': 'unhighlight-lasso-selected',
        //***************************
        //  从tree.config视图中发出的信号
        //  用户点击attribute按钮时, 用户打开distribution视图
        'OPEN_DISTRIBUTION_VIEW': 'open-distribution-view',
        //  用户点击捅破logical按钮时, 用户关闭distribution视图
        'CLOSE_DISTRIBUTION_VIEW': 'close-distribution-view',
        // **************************
        //  从top.config.view视图发出的信号
        //  点击未选择的barcode的group, 选择该group中的barcodeTree
        'SELECT_GROUP_BARCODETREE': 'select-group-barcodetree',
        //  点击已选择的barcode的group, 取消选择该group中的barcodeTree
        'UNSELECT_GROUP_BARCODETREE': 'unselect-group-barcodetree',
        //  更新选择的barcodeTree的list
        'UPDATE_SELECTION_LIST': 'update-selection-list',
        //  barcode视图发生变化, 重新绘制barcode视图
        'UPDATE_BARCODE_VIEW': 'update-barcode-view',
        //  使用animation 更新barcode视图
        'UPDATE_ANIATION_BARCODE_VIEW': 'update_animation-barcode-view',
        //*******************************************
        //  删除的属性
        //  更新barcode的位置
        'UPDATE_BARCODE_LOC': 'update-barcode-loc',
        //  更新barcode比较的summary
        'UPDATE_SUMMARY': 'update-summary',
      },
      'PREFIX': {
        'BARCODE_G': 'barcode-g-'
      },
      'BARCODE_ICON_NAME': {
        'CompactMode': '\uf009',
        'OriginalMode': '\uf04c',
        'TheWholeTreeMode': '\uf039',
        'TheSuperTreeMode': '\uf036',
        'ExpandMode': '\uf07e',
        'CompressMode': '\uf07e',
        'CollapsedBarcode': '\uf066',
        'ExpandBarcode': '\uf065',
        'RefreshBarcode': '\uf01e'
      },
      //  app.view视图中控制barcode node的configview的初始化
      'HEIGHT_CONTROL_NAME': 'height',
      'WIDTH_ARRAY_CONTROL_NAME_PREFIX': 'level',
      'INTERVAL_CONTROL_NAME': 'interval',
      'MAX_BARCODE_WIDTH': 20,
      'BARCODE_ALIGNED_NODE_GAP': 0,//15
      'COMPACT_NUM': 5,
      'BARCODE_NODE_GAP': 2,
      'MAX_BARCODE_NODE_PADDING': 300,
      'NAVBAR_HEIGHT': 30,
      'TOOLTIP_TRIANGLE_HEIGHT': 10,
      'TOOLTIP_HEIGHT': 30,
      //  比较结果柱状图的宽度
      'COMPARISON_RESULT_PADDING': 50,//80,
      'SERVER_ADDRESS': window.location.hostname, //  '127.0.0.1'
      'SERVER_PORT': 8081,
      //  barcode.single.view中动画需要的时间
      'TRANSITON_DURATION': 1000,
      //  barcode.single.view中结束动画之后增加增加icon需要的时间
      'WAIT_DURATION': 1500,
      'MOVE_DURATION': 1000,
      'INITIALIZE_DATESET': 'LibraryTree_DailyName',
      'COMPACT_TOLERANCE': 50,
      'MAX_WIDTH_VALUE': 100,
      'LABEL_OBJECT': {
        'DailyRecordTree': {
          'x': 'Date',
          'y': 'Node Num'
        },
        'RecordTree': {
          'x': 'Date',
          'y': 'Node Num'
        },
        'SignalTree': {
          'x': 'Date',
          'y': 'FlowSize/log'
        },
        'RepostingTree': {
          'x': 'Date',
          'y': 'Node Num'
        },
        'PhylogeneticTree': {
          'x': 'Date',
          'y': 'Node Num'
        },
        'DirectoryTree': {
          'x': 'Date',
          'y': 'Node Num'
        }
      }
    }
  }))()
  return window.Config
})
