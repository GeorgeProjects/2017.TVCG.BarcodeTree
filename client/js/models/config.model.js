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
      'CONSTANT': {
        'ORIGINAL': 'ORIGINAL',
        'COMPACT': 'COMPACT',
        'UNION': 'UNION',
        'FISHEYE': 'FISHEYE',
        'ABSOLUTE_COMPACT_FATHER': 'ABSOLUTE_COMPACT_FATHER',
        'ABSOLUTE_COMPACT_CHILDREN': 'ABSOLUTE_COMPACT_CHILDREN',
        'TEMPLATE': 'TEMPLATE'
      },
      'BARCODE_COLOR': {
        'ROOT_COLOR': '#000000',
        'LEAF_COLOR': '#DCDCDC'
      },
      'DEFAULT_SETTINGS': {
        'default_dataset': 'DailyRecordTree',
        'default_mode': 'original',
        'compact_num': 5,
        'original_width_array': [ 18, 12, 8, 4, 0 ],
        'default_width_array': [ 18, 12, 8, 4, 0 ],// large screen
        'default_barcode_height': 40,
        'default_selected_levels': [ 0, 1, 2, 3]
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
        'SET_PRECLICK_COLOR': 'set-preclick-color',
        'UPDATE_DISTRIBUTION_VIEW': 'update-distribution-view',
        'UPDATE_FILTERING_HIGHLIGHT_NODES': 'update-filtering-highlight-nodes',
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
        //  开始渲染视图(在获取数据的基础信息之后,即柱状图相关的信息)
        'BEGIN_RENDER_HISTOGRAM_VIEW': 'begin-render-histogram-view',
        //  开始渲染barcode视图
        'BEGIN_RENDER_BARCODE_VIEW': 'begin-render-barcode-view',
        //  渲染完成视图之后, 将加载的进度条消失
        'FINISH_RENDER_VIEW': 'finish-render-view',
        //  选中视图中的所有元素
        'SELECT_ALL': 'select-all',
        //  在barcodeview里点击未选中的barcode选中barcode
        'SELECT_BARCODE_EVENT': 'select-barcode',
        //  在barcodeview里点击选中的barcode取消选中barcode
        'UNSELECT_BARCODE_EVENT': 'unselect-barcode',
        //  清空选中视图中的所有元素
        'CLEAR_ALL': 'clear-all',
        //  显示loading的标志
        'SHOW_LOADING_ICON': 'show-loading-icon',
        //  隐藏loading的标志
        'HIDE_LOADING_ICON': 'hide-loading-icon',
        //  更新barcode的高度以及位置
        'UPDATE_BARCODE_ATTR': 'update-barcode-attr',
        //  更新histogram视图中的颜色映射
        'UPDATE_HISTOGRAM_ENCODE': 'update-histogram-encode',
        //  barcode视图发生变化, 重新绘制barcode视图
        'UPDATE_BARCODE_VIEW': 'update-barcode-view',
        //  更新barcode视图的宽度
        'UPDATE_BARCODE_VIEW_WIDTH': 'update-barcode-view-width',
        //  取消在单个视图上的高亮效果
        'NODE_MOUSEOUT': 'node-mouseout',
        //  渲染supertree
        'RENDER_SUPERTREE': 'render-supertree',
        //  渲染覆盖在barcode的上面的带有斜纹的矩形
        'RENDER_HOVER_RECT': 'render-hover-rect',
        //  更新barcode的位置
        'UPDATE_BARCODE_LOC': 'update-barcode-loc',
        //  更新barcode比较的summary
        'UPDATE_SUMMARY': 'update-summary',
        //  增加barcode model
        'ADD_MODEL': 'add-model',
        //  高亮supertree上排序的节点
        'HOVERING_SORT_BARCODE_NODE': 'hovering-sort-barcode-node',
        //  取消高亮supertree上排序的节点
        'UNHOVERING_SORT_BARCODE_NODE': 'unhovering-sort-barcode-node',
        //  打开superTree panel视图
        'OPEN_SUPER_TREE': 'open-super-tree',
        //  重新设置barcode的相关参数
        'RESET_BARCODE_ATTR': 'reset-barcode-attr',
        //  鼠标悬浮在某个barcode上面广播的事件
        'HOVERING_BARCODE_EVENT': 'hovering-barcode',
        //  鼠标从某个barcode上面移开广播的事件
        'UN_HOVERING_BARCODE_EVENT': 'unhovering-barcode',
        //  改变barcode的宽度
        'CHANGE_BARCODE_WIDTH': 'render-barcode-width-controller',
        //  将barcode从original模式转换为compact模式
        'TRANSITON_ORIGINAL_TO_COMPACT': 'transition-original-to-compact', // para: null
        //  将barcode从compact模式转换为original模式
        'TRANSITON_COMPACT_TO_ORIGINAL': 'transition-compact-to-original', // para: null
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
        'RENDER_HISTOGRAM': 'render-histogram',
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
      'MAX_BARCODE_WIDTH': 20,
      'BARCODE_ALIGNED_NODE_GAP': 0,//15
      'COMPACT_NUM': 5,
      'BARCODE_NODE_GAP': 2,
      'BARCODE_NODE_PADDING': 20,
      'COMPARISON_RESULT_PADDING': 80,
      'SERVER_ADDRESS': window.location.hostname, //  '127.0.0.1'
      'SERVER_PORT': 8081,
      'TRANSITON_DURATION': 1000,
      'MOVE_DURATION': 1000,
      'INITIALIZE_DATESET': 'LibraryTree_DailyName',
      'COMPACT_TOLERANCE': 50,
      'PER_GAP_WIDTH': 2,
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
