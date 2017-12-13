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
        'LibraryTree_Name': 'RecordTree',
        'SignalTree_Name': 'SignalTree',
        'RepostingTree_Name': 'RepostingTree',
        'PhylogeneticTree_Name': 'PhylogeneticTree',
        'DirectoryTree_Name': 'DirectoryTree'
      },
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
        'NOT_SELECTED': 'NOT_SELECTED'
      },
      'BARCODE_COLOR': {
        'ROOT_COLOR': '#000000',
        'LEAF_COLOR': '#DCDCDC',
        'ADD_NODE_COLOR': '#a1d76a',
        'MISS_NODE_COLOR': '#e9a3c9',
        'SAME_NODE_COLOR': 'black'
      },
      'DEFAULT_SETTINGS': {
        'default_dataset': 'DailyRecordTree',
        'default_mode': 'original',
        'compact_num': 5,
        'init_width': 1600,
        'init_height': 900,
        'barcode_node_interval': 3,
        'original_width_array': [18, 12, 8, 4, 0],
        'default_width_array': [18, 12, 8, 4, 0],// large screen
        'default_barcode_height': 40,
        'default_selected_levels': [0, 1, 2, 3]
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
        //*******************************************
        //  设置选择的颜色
        'SET_PRECLICK_COLOR': 'set-preclick-color',
        'UPDATE_DISTRIBUTION_VIEW': 'update-distribution-view',
        'UPDATE_FILTERING_HIGHLIGHT_NODES': 'update-filtering-highlight-nodes',
        //  更新barcode视图的宽度
        'UPDATE_BARCODE_VIEW_WIDTH': 'update-barcode-view-width',
        //  选中视图中的所有元素
        'SELECT_ALL': 'select-all',

        //  渲染supertree
        'RENDER_SUPERTREE': 'render-supertree',
        //  渲染histogram视图
        'RENDER_HISTOGRAM': 'render-histogram',
        //  更新histogram视图中的颜色映射
        'UPDATE_HISTOGRAM_ENCODE': 'update-histogram-encode',
        //  渲染完成视图之后, 将加载的进度条消失
        'FINISH_RENDER_VIEW': 'finish-render-view',
        //  开始渲染视图(在获取数据的基础信息之后,即柱状图相关的信息)
        'BEGIN_RENDER_HISTOGRAM_VIEW': 'begin-render-histogram-view',
        //  开始渲染barcode视图
        'BEGIN_RENDER_BARCODE_VIEW': 'begin-render-barcode-view',
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
        //  高亮supertree上排序的节点
        'HOVERING_SORT_BARCODE_NODE': 'hovering-sort-barcode-node',
        //  在superTree视图中鼠标放在上方的节点上
        'HIGHLIGHT_ALL_RELATED_NODE': 'highlight-all-related-node',
        //  在superTree视图中鼠标点击选择的节点
        'HIGHLIGHT_ALL_SELECTED_NODE_SUPERTREEVIEW': 'highlight-all-selected-node',
        //  在superTree视图中鼠标从上方的节点上移开
        'UNHIGHLIGHT_ALL_RELATED_NODE': 'unhighlight-all-related-node',
        //  取消高亮supertree上排序的节点
        'UNHOVERING_SORT_BARCODE_NODE': 'unhovering-sort-barcode-node',
        //  取消在单个视图上的高亮效果
        'NODE_MOUSEOUT': 'node-mouseout',
        //***************************
        // barcode.collection视图上发出的信号
        //  更新barcode的高度以及位置
        'UPDATE_BARCODE_ATTR': 'update-barcode-attr',
        //  重新设置barcode的相关参数
        'RESET_BARCODE_ATTR': 'reset-barcode-attr',
        //  显示loading的标志
        'SHOW_LOADING_ICON': 'show-loading-icon',
        //  隐藏loading的标志
        'HIDE_LOADING_ICON': 'hide-loading-icon',
        //***************************
        //  barcode.single视图上发出的信号
        //  渲染覆盖在barcode的上面的带有斜纹的矩形
        'RENDER_HOVER_RECT': 'render-hover-rect',
        //  高亮相关的节点
        'HIGH_RELATED_NODES': 'highlight-related-nodes',
        //  在barcodeview里点击选中的barcode取消选中barcode
        'UNSELECT_BARCODE_EVENT': 'unselect-barcode',
        //  在barcodeview里点击未选中的barcode选中barcode
        'SELECT_BARCODE_EVENT': 'select-barcode',
        //  鼠标从某个barcode上面移开广播的事件
        'UN_HOVERING_BARCODE_EVENT': 'unhovering-barcode',
        //  鼠标悬浮在某个barcode上面广播的事件
        'HOVERING_BARCODE_EVENT': 'hovering-barcode',
        //  视图的barcode的节点更新
        'VIEW_UPDATE': 'view-update',
        //  删除barcode视图上方的options按钮
        'REMOVE_OPTIONS_BUTTTON': 'remove_options_button',
        //  更新barcode的配置视图
        'UPDATE_TREE_CONFIG_VIEW': 'update-tree-config-view',
        //  删除总结的柱状图
        'REMOVE_SUMMARY_STATE': 'remove-summary-state',
        //  展示总结的柱状图
        'SHOW_SUMMARY_STATE': 'show-summary-state',
        //***************************
        //  从toolbar视图中发出的信号
        //  将barcode从original模式转换为compact模式
        'TRANSITON_ORIGINAL_TO_COMPACT': 'transition-original-to-compact', // para: null
        //  将barcode从compact模式转换为original模式
        'TRANSITON_COMPACT_TO_ORIGINAL': 'transition-compact-to-original', // para: null
        //***************************
        //  从tree.config视图中发出的信号
        //  用户点击attribute按钮时, 用户打开distribution视图
        'OPEN_DISTRIBUTION_VIEW': 'open-distribution-view',
        //  用户点击捅破logical按钮时, 用户关闭distribution视图
        'CLOSE_DISTRIBUTION_VIEW': 'close-distribution-view',
        //*******************************************
        //  删除的属性
        //*******************************************
        //*******************************************
        'UPDATE_ALIGN_LEVEL': 'update-align-level',
        //  单树模式下高亮nodelink树中的节点
        'HIGHLIGHT_NODELINK_NODE': 'highlight-nodelink-node',
        //  单树模式下取消高亮nodelink树中的节点
        'UNHIGHLIGHT_NODELINK_NODE': 'unhighlight-nodelink-node',
        //  单树模式下高亮barcode树中的节点
        'HIGHLIGHT_BARCODE_NODE': 'highlight-barcode-node',
        //  单树模式下取消高亮barcode树中的节点
        'UNHIGHLIGHT_BARCODE_NODE': 'unhighlight-barcode-node',
        //  单树模式下, 上传完成之后开始渲染nodelinktree
        'RENDER_UPLOAD_NODELINK_TREE': 'render-upload-nodelink-tree',
        //  单树模式下, 上传完成之后开始渲染barcodetree
        'RENDER_UPLOAD_BARCODE_TREE': 'render-upload-barcode-tree',
        //  barcode视图发生变化, 重新绘制barcode视图
        'UPDATE_BARCODE_VIEW': 'update-barcode-view',
        //  更新barcode的位置
        'UPDATE_BARCODE_LOC': 'update-barcode-loc',
        //  更新barcode比较的summary
        'UPDATE_SUMMARY': 'update-summary',
        //  增加barcode model
        'ADD_MODEL': 'add-model',

        //  改变barcode的宽度
        'CHANGE_BARCODE_WIDTH': 'render-barcode-width-controller',
        //  绘制barcode
        'RENDER_BARCODE': 'render-barcode', // para: null
        //  渲染superTree中的节点
        'RENDER_SUPERTREE_BARCODE': 'render-supertree-barcode', // para: null
        //  鼠标离开节点时候发出的信号
        'NODE_MOUSE_OUT': 'node-mouse-out', // para: null
        //  渲染superTreeline的时候发出的信号
        'RENDER_SUPERTREELINE_BARCODE': 'render-supertreeline-barcode', // para: null
        //
        'RENDER_WHOLE_TO_SUPERTREE': 'render-whole-to-supertree', // para: null
        'RENDER_DATELINE_CHART': 'render-datelinechart',
        //  高亮当前选中的节点
        'HIGHLIGHT_SELECTED_TREE': 'highlight-selected-tree', //
        //  高亮supertree上的节点
        'HIGHLIGHT_SUPERTREE_NODE': 'highlight-supertree-node',
        //  高亮histogram
        'HIGHLIGHT_ADDED_HISTOGRAM': 'highlight-added-histogram',
        //  从supertree中高亮barcodematrix中的节点
        'HIGHLIGHT_BARCODEMATRIX_NODE': 'highlight-barcodematrix-node',
        //  从supertree中点击高亮barcodematrix中的节点
        'CLICK_HIGHLIGHT_BARCODEMATRIX_NODE': 'click-highlight-barcodematrix-node',
        //从supertree中点击取消高亮barcodematrix中的节点
        'CLICK_UNHIGHLIGHT_BARCODEMATRIX_NODE': 'click_unhighlight_barcodematrix_node',
        //  刷选进行选中,查看分布
        'BRUSH_SELECTION_HIGHLIGHT': 'brush_selection_highlight',
        //  取消高亮supertree上的节点
        'UNHIGHLIGHT_SUPERTREE_NODE': 'unhighlight-supertree-node',
        'UNHIGHLIGHT_SELECTED_TREE': 'unhighlight-selected-tree',
        'TO_FILTERING_BARCODE_MATRIX_NODE': 'to-filtering-barcode-matrix-node',
        'TO_FILTERING_DISTRIBUTION_HISTOGRAM': 'to-filtering-distribution-histogram',
        'ADD_SORT_ICON': 'add-sort-icon',
        //  在直方图上进行刷选从而筛选节点
        'BRUSH_HISTOGRAM': 'brush_histogram',
        'RESIZE': 'resize',
        'RENDER_ARCLINK': 'render-arclink',
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
      'BARCODE_NODE_PADDING': 20,
      'NAVBAR_HEIGHT': 30,
      'TOOLTIP_TRIANGLE_HEIGHT': 10,
      'TOOLTIP_HEIGHT': 30,
      //  比较结果柱状图的宽度
      'COMPARISON_RESULT_PADDING': 80,//80,
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
