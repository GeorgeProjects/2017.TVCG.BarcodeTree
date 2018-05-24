define([
		'require',
		'marionette',
		'underscore',
		'jquery',
		'backbone',
		'd3',
		'datacenter',
		'config',
		'variables',
		'bootstrap',
		'sweetalert',
		'text!templates/top.toolbar.tpl'
], function (require, Mn, _, $, Backbone, d3, Datacenter, Config, Variables, Bootstrap, sweetalert, Tpl) {
		'use strict'
		//  barcode.view中包含三个视图, 分别是比较barcodeTree的主视图, barcode的superTree视图, barcode的参数控制视图
		return Mn.LayoutView.extend({
				tagName: 'div',
				template: _.template(Tpl),
				default: {
						duration: 500
				},
				attributes: {
						'style': 'height: 100%; width: 100%',
						'class': 'row-fluid'
				},
				events: {
						// 节点选择
						'click #single-node-selection': 'single_node_selection',
						'click #subtree-node-selection': 'subtree_node_selection',
						'click #tree-selection': 'tree_selection',
						'click #father-child-link': 'show_father_child_link',
						'click #selection-refresh': 'selection_refresh',
						'click #highlight-mode': 'change_highlight_mode',
						'click #selection-tooltip': 'selection_tooltip',
						// 子树操作
						'click #subtree-collapse': 'subtree_collapse',
						'click #subtree-uncollapse': 'subtree_uncollapse',
						'click #subtree-operation-refresh': 'subtree_operation_refresh',
						// 子树比较
						'click #compare-lock': 'compare_lock',
						'click #align-mode-controller': 'align_mode_control',
						'click #align-selected-tree': 'align_selected_tree',
						'click #align-whole-tree': 'align_whole_tree',
						'click #summary-comparison': 'summary_comparison',
						'click #barcodetree-segment': 'barcodetree_segment',
						'click #structure-comparison': 'aligned_level_control',
						'click #change-subtree-display-mode': 'change_subtree_display_mode',
						'click #show-padding-node': 'showing_padding_node',
						'click #node-number-comparison': 'node_number_comparison',
						'click #refresh-comparison': 'refresh_comparison',
						// 排序
						'click #sort-options': 'sort_options',
						'click #sort-desc': 'sort_desc',
						'click #sort-asc': 'sort_asc',
						'click #node-arrangement': 'node_arrangement',
						'click #sort-refresh': 'sort_refresh',
						// 相似性排序
						'click #similarity-resorting': 'similarity_resorting',
						'click #similarity-refresh': 'similarity_refresh',
						// 配置视图
						'click #node-config-panel-toggle': 'node_config_panel_toggle_handler',
						'click #tree-config-panel-toggle': 'tree_config_panel_toggle_handler',
						// 对于子树的交并补操作
						'click #and-operation-toggle': 'and_operation_toggle',
						'click #or-operation-toggle': 'or_operation_toggle',
						'click #complement-operation-toggle': 'complement_operation_toggle'
				},
				initialize: function () {
						var self = this
						self.d3el = d3.select(self.el)
						self.initEvent()
				},
				//  initEvent
				initEvent: function () {
						var self = this
						//  在对齐的层级以及固定的层级改变时,会自动更新
						self.listenTo(Variables, 'change:displayFixedLevel', self.activeAlignedLevel)
						self.listenTo(Variables, 'change:displayAlignedLevel', self.activeAlignedLevel)
						self.listenTo(Variables, 'change:segmentLevel', self.activeSegmentLevel)
						//  更新group事件中的选中的barcodeTree的列表, 分别按照星期对于选中的barcodeTree进行分类
						Backbone.Events.on(Config.get('EVENTS')['UPDATE_SELECTION_LIST'], function (event) {
								var selectionList = event.selectionList
								self.add_selection_list(selectionList)
						})
						//  鼠标在comparisonview中点击选中barcode广播的事件, 将选中的barcodeTree作为基准树, 其他的树与基准树进行比较
						Backbone.Events.on(Config.get('EVENTS')['SET_SELECT_BARCODE_EVENT'], function (event) {
								var barcodeTreeId = event.barcodeTreeId
								self.add_set_selection_barcode(barcodeTreeId)
						})
						//  更新选中的barcdoeTree的层级
						Backbone.Events.on(Config.get('EVENTS')['UPDATE_SELECTED_LEVELS'], function () {
								console.log('UPDATE_SELECTED_LEVELS')
								self.update_toolbar_align_control()
								self.update_toolbar_segment_control()
						})
						//  清空所有的选择子树时, 需要将所有的参数还原
						Backbone.Events.on(Config.get('EVENTS')['CLEAR_ALL'], function (event) {
								self.reset_all_overview_parameters()
						})
				},
				trigger_disable_tree_selection: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['DISABLE_LASSO_FUNCTION'])
				},
				trigger_enable_tree_selection: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['ENABLE_LASSO_FUNCTION'])
				},
				trigger_mouseout_event: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['NODE_MOUSEOUT'])
				},
				//  更新supertree的视图
				trigger_super_view_update: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['RENDER_SUPERTREE'])
				},
				//  触发显示summary的状态的信号
				trigger_show_summary_state: function (nodeObjId) {
						Backbone.Events.trigger(Config.get('EVENTS')['SHOW_SUMMARY_STATE'], {
								'nodeObjId': nodeObjId
						})
				},
				//  删除summary的柱状图
				trigger_remove_summary_state: function (nodeObjId) {
						Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_SUMMARY_STATE'], {
								'nodeObjId': nodeObjId
						})
				},
				//  更新treeconfig的视图
				trigger_update_tree_config_view: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_TREE_CONFIG_VIEW'])
				},
				//  trigger信号, 在aligned的节点上增加locked-align的类别
				trigger_add_locked_align_class: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['ADD_LOCKED_ALIGN_CLASS'])
				},
				//  trigger信号, 在aligned的节点上删除locked-align的类别
				trigger_remove_locked_align_class: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_LOCKED_ALIGN_CLASS'])
				},
				trigger_update_distribution_view: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_DISTRIBUTION_VIEW'])
				},
				onShow: function () {
						var self = this
						var fixedAlignedLevel = 0
						self.update_aligned_level_controller(fixedAlignedLevel)
						var segmentLevel = 0
						self.update_segment_level_controller(segmentLevel)
						self.init_slider()
						self.init_sort_options()
						self.init_hovering_event()
						self.init_selection_list()
						self.init_drop_down_menu(Variables.get('closable'))
						self.init_mouseout_event()
						self.update_aligned_level()
				},
				init_mouseout_event: function () {
						var self = this
						$('.config-button').on('mouseover', function (d, i) {
								self.trigger_mouseout_event()
						})
				},
				reset_align_parameters: function () {
						var self = this
						var defaultLevel = 0
						//  对齐状态设为false
						$('#align-mode-controller').removeClass('active')
						//  unalign之后 设置alignedLevel为0
						Variables.set('alignedLevel', defaultLevel)
						//  固定的层级
						var fixedLevel = 0
						var alignedLevel = 1
						Variables.set('displayFixedLevel', fixedLevel)
						Variables.set('displayAlignedLevel', alignedLevel)
						//  对齐层级设为0
						$('#compare-lock .fa').removeClass('fa-lock')
						self.change_to_compare_unlock_state()
				},
				//  清空所有的在全局状态下的参数, 设置的是参数设置的所有的表现出的结果以及具体的参数值
				reset_all_overview_parameters: function () {
						var self = this
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//  重设对齐的参数
						self.reset_align_parameters()
						//  取消显示histogram
						$('#compare-operation #summary-comparison').removeClass('active')
						BarcodeGlobalSetting['Comparison_Result_Display'] = false
						//  focus+context设置为false
						$('#change-subtree-display-mode').removeClass('active')
						//  在global模式下 取消子树的focus状态, 那么需要删除当前的tablelens的节点
						BarcodeGlobalSetting['Subtree_Compact'] = false
						//  paddingNode设置为hidden
						$('#show-padding-node').removeClass('active')
						Variables.set('is_show_padding_node', false)
						//  global comparison设置为false
						BarcodeGlobalSetting['Align_State'] = false
						$('#align-mode-controller').removeClass('active')
						//  lock的状态设置为unlock
						$('#compare-lock .fa').removeClass('fa-lock')
						$('#compare-lock .fa').addClass('fa-unlock')
						BarcodeGlobalSetting['Align_Lock'] = false
				},
				//	更新toolbar上的segment控制的视图, 主要是初始化全部可能的segment的层级
				update_toolbar_segment_control: function () {
						var self = this
						var maxDepth = Variables.get('maxDepth')
						$('#segment-level-menu-container > #segment-level-control > .level-btn').remove()
						for (var mI = 0; mI <= maxDepth; mI++) {
								var segmentLevel = mI + 1
								var buttonId = "btn-" + segmentLevel
								var alignedLevelItem = "<button type = \"button\"" + "class = \"btn level-btn btn-default btn-lg\" id=\"" + buttonId + "\">" + segmentLevel + "</button>"
								$('#segment-level-menu-container > #segment-level-control').append(alignedLevelItem)
						}
				},
				//  更新toolbar上的align控制的视图, 这一部分是初始化全部可能的align的层级
				update_toolbar_align_control: function () {
						var self = this
						var maxDepth = Variables.get('maxDepth')
						$('#aligned-level-menu-container > #align-level-control > .level-btn').remove()
						for (var aI = 0; aI <= maxDepth; aI++) {
								var alignedLevel = aI + 1
								var buttonId = "btn-" + alignedLevel
								var alignedLevelItem = "<button type = \"button\"" + "class = \"btn level-btn btn-default btn-lg\" id=\"" + buttonId + "\">" + alignedLevel + "</button>"
								$('#aligned-level-menu-container > #align-level-control').append(alignedLevelItem)
						}
				},
				//
				init_sort_options: function () {
						var self = this
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						$('#sort-options-text').text(BarcodeGlobalSetting['Sort_Option'])
						$(document).on('change', 'input:radio[id^="options-"]', function (event) {
								var sortOption = $(this).val()
								$('#sort-options-text').text(sortOption)
								BarcodeGlobalSetting['Sort_Option'] = sortOption
						})
				},
				//  取消button上的事件
				disable_buttons: function (buttons) {
						var self = this
						buttons.prop('disabled', true)
				},
				//  增加button上的事件
				enable_buttons: function (buttons) {
						var self = this
						buttons.prop('disabled', false)
				},
				//  初始化鼠标hovering的事件
				init_hovering_event: function () {
						var self = this
						//  鼠标hovering在该视图上, 会删除在barcode上hovering的效果
						$('#top-toolbar-container').on('click', function () {
								// self.trigger_mouseout_event()
						})
				},
				/**
					*  点击selection tooltip按钮控制是否显示tooltip
					*/
				selection_tooltip: function () {
						var self = this
						if ($('#selection-tooltip').hasClass('active')) {
								$('#selection-tooltip').removeClass('active')
								Config.set('BARCODETREE_TOOLTIP_ENABLE', false)
						} else {
								$('#selection-tooltip').addClass('active')
								Config.set('BARCODETREE_TOOLTIP_ENABLE', true)
						}
				},
				/**
					* 根据切割的层级更新切割层级的具体显示
					*/
				activeSegmentLevel: function () {
						var self = this
						var sortingModel = self.model
						var barcodeCollection = self.options.barcodeCollection
						$('#segment-level-menu #segment-level-control>.btn').removeClass('active')
						var segmentLevel = Variables.get('segmentLevel')
						//	因为是segement的层级, 因此从segmentLevel + 1开始递减, 一直到最小的层级为1
						for (var sI = (segmentLevel + 1); sI >= 1; sI--) {
								$('#segment-level-menu #segment-level-control>#btn-' + sI).addClass('active')
						}
						//	设置barcodeTree的segmentLevel的显示层级
						var displaySegmentLevel = Variables.get('segmentLevel') + 1
						var segmentLevelText = $('#segement-level-text')
						segmentLevelText.text("L" + displaySegmentLevel)
						barcodeCollection.align_node_in_selected_list()
				},
				/**
					* 根据对齐层级的数值更新对齐层级的具体显示
					*/
				activeAlignedLevel: function () {
						var self = this
						//  选择层级的控制视图中对齐的层级
						var displayAlignedLevel = Variables.get('displayAlignedLevel')
						//  选择层级的控制视图中固定的层级
						var displayFixedLevel = Variables.get('displayFixedLevel')
						var alignedLevelText = $('#aligned-level-text')
						alignedLevelText.text("L" + displayAlignedLevel)
						$('#aligned-level-menu #align-level-control>.btn').removeClass('active')
						//  将fixed的aligned level去掉
						self.enable_buttons($('#aligned-level-menu #align-level-control>.btn'))
						for (var lI = displayFixedLevel; lI >= 0; lI--) {
								$('#aligned-level-menu #align-level-control>#btn-' + lI).addClass('active')
								//  对于已经aligned部分的节点fixed其aligned的部分
								self.disable_buttons($('#aligned-level-menu #align-level-control>#btn-' + lI))
						}
						for (var lI = displayAlignedLevel; lI >= displayFixedLevel; lI--) {
								$('#aligned-level-menu #align-level-control>#btn-' + lI).addClass('active')
						}
				},
				update_segment_level_controller: function (segment_level) {
						var self = this
						var sortingModel = self.model
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						Variables.set('segmentLevel', segment_level)
						$('#segment-level-control>.level-btn').unbind("click")
						$('#segment-level-control>.level-btn').click(function () {
								var displayLevel = +$(this).text()
								var segmentLevel = displayLevel - 1
								Variables.set('segmentLevel', segmentLevel)
								var alignedLevel = Variables.get('alignedLevel')
								if (segmentLevel > alignedLevel) {
										Variables.set('alignedLevel', segmentLevel)
										Variables.set('displayAlignedLevel', (segmentLevel + 1))
								}
								//	如果segement的层级为1, 那么就不进行切割
								if (displayLevel === 1) {
										BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split'] = false
								} else {
										BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split'] = true
								}
								console.log('BarcodeTree_Split', BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split'])
						})
				},
				update_aligned_level_controller: function (fixed_aligned_level) {
						var self = this
						var maxDepth = Variables.get('maxDepth')
						var alignedBarcodeLevel = Variables.get('alignedLevel')
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var Max_Real_Level = BarcodeGlobalSetting.Max_Real_Level
						var barcodeCollection = self.options.barcodeCollection
						var displayedLevel = alignedBarcodeLevel + 1
						var displayedFixedAlignedLevel = fixed_aligned_level
						Variables.set('displayFixedLevel', displayedFixedAlignedLevel)
						Variables.set('displayAlignedLevel', displayedLevel)
						// self.activeAlignedLevel(displayedFixedAlignedLevel, displayedLevel)
						$('#align-level-control>.level-btn').unbind("click")
						$('#align-level-control>.level-btn').click(function () {
								var displayLevel = +$(this).text()
								var realLevel = displayLevel - 1
								Variables.set('displayFixedLevel', displayedFixedAlignedLevel)
								Variables.set('displayAlignedLevel', displayLevel)
								Variables.set('alignedLevel', realLevel)
								barcodeCollection.align_node_in_selected_list()
								//	如果选择的alignedLevel比当前的segmentLevel层次更浅, 那么自动的更新segmentLevel的层级
								var segmentLevel = Variables.get('segmentLevel')
								if (realLevel < segmentLevel) {
										Variables.set('segmentLevel', realLevel)
								}
								// 设置alignedLevel时, 会自动的将barcodeTree设置为aligned的状态
								BarcodeGlobalSetting['Align_State'] = true
								//	对齐的层级控制align-mode-controller是否处于active的状态
								if (displayLevel === 1) {
										//	当barcodeTree的对齐层级为1时, 则取消align-mode-controller的active状态
										$('#align-mode-controller').removeClass('active')
								} else {
										//	当barcodeTree的对齐层级比第一层更深的情况下, 则增加align-mode-controller的active状态
										$('#align-mode-controller').addClass('active')
								}
						})
				},
				//  初始化sliderbar
				init_slider: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var similarityMinHandler = $("#similarity-min-handle")
						var similarityMaxHandler = $("#similarity-max-handle")
						var similaritySliderText = $("#similarity-slider-text")
						var selectedSimilarityRange = Variables.get('similarityRange')
						$("#similarity-slider").slider({
								range: "true",
								min: 0,
								max: 100,
								values: selectedSimilarityRange,
								create: function () {
										similarityMinHandler.text(selectedSimilarityRange[0] + "%")
										similarityMaxHandler.text(selectedSimilarityRange[1] + "%")
										similaritySliderText.text("0%")
								},
								slide: function (event, ui) {
										var value = ui.values
										similarityMinHandler.text(value[0] + "%")
										similarityMaxHandler.text(value[1] + "%")
										similaritySliderText.text(value[0] + "%-" + value[1] + "%")
										barcodeCollection.filter_barcode(value)
										if ((value[0] === 0) && (value[1] === 0)) {
												similaritySliderText.text("0%")
										}
								}
						})
				},
				//  barcodeTree上的选择操作
				//  选择barcodeTree上的单个节点
				single_node_selection: function () {
						var self = this
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if (!$('#barcode-selection #single-node-selection').hasClass('active')) {
								$('#barcode-selection .config-button:not(#selection-tooltip):not(#tree-selection)').removeClass('active')
								$('#barcode-selection #single-node-selection').addClass('active')
								BARCODETREE_GLOBAL_PARAS['Selection_State'] = Config.get('CONSTANT')['NODE_SELECTION']
								//  删除father children之间的连线
								$('#father-child-link').removeClass('active')
								Variables.set('show_father_child_link', false)
								//  disable #father-child-link的按钮
								self.disable_buttons($('#father-child-link'))
								Variables.set('highlight_node', true)
						} else {
								$('#barcode-selection #single-node-selection').removeClass('active')
								Variables.set('highlight_node', false)
								//  设置当前的选择状态为NULL
								BARCODETREE_GLOBAL_PARAS['Selection_State'] = Config.get('CONSTANT')['NULL_SELECTION']
								// BARCODETREE_GLOBAL_PARAS['Selection_State'] = Config.get('CONSTANT')['UN_SELECTION']
						}
						self.trigger_mouseout_event()
				},
				//  选择barcodeTree上的子树
				subtree_node_selection: function () {
						var self = this
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if (!$('#barcode-selection #subtree-node-selection').hasClass('active')) {
								$('#barcode-selection .config-button:not(#selection-tooltip):not(#tree-selection)').removeClass('active')
								$('#barcode-selection #subtree-node-selection').addClass('active')
								BARCODETREE_GLOBAL_PARAS['Selection_State'] = Config.get('CONSTANT')['SUBTREE_SELECTION']
								// //  增加father children之间的连线
								$('#father-child-link').removeClass('active')
								Variables.set('show_father_child_link', false)
								//  enable #father-child-link的按钮
								self.enable_buttons($('#father-child-link'))
								Variables.set('highlight_node', true)
						} else {
								$('#barcode-selection #subtree-node-selection').removeClass('active')
								$('#father-child-link').removeClass('active')
								Variables.set('show_father_child_link', false)
								Variables.set('highlight_node', false)
								//  disable #father-child-link的按钮
								self.disable_buttons($('#father-child-link'))
								//  设置当前的选择状态为NULL
								BARCODETREE_GLOBAL_PARAS['Selection_State'] = Config.get('CONSTANT')['NULL_SELECTION']
								// BARCODETREE_GLOBAL_PARAS['Selection_State'] = Config.get('CONSTANT')['UN_SELECTION']
						}
						self.trigger_mouseout_event()
				},
				show_father_child_link: function () {
						var self = this
						if ($('#father-child-link').hasClass('active')) {
								$('#father-child-link').removeClass('active')
								Variables.set('show_father_child_link', false)
						} else {
								Variables.set('show_father_child_link', true)
								$('#father-child-link').addClass('active')
						}
				},
				//  选择整个的barcodeTree
				tree_selection: function () {
						var self = this
						if ($('#tree-selection').hasClass('active')) {
								$('#tree-selection').removeClass('active')
								Variables.set('enable_lasso', false)
								d3.selectAll('#lasso-area')
										.remove()
						} else {
								Variables.set('enable_lasso', true)
								$('#tree-selection').addClass('active')
								self.trigger_enable_tree_selection()
						}
				},
				//  改变当前节点的高亮状态
				change_highlight_mode: function () {
						var self = this
						if ($('#highlight-mode > .iconfont').hasClass('icon-highlight-mode')) {
								$('#highlight-mode > .iconfont').removeClass('icon-highlight-mode').addClass('icon-highlight-mode-')
								Variables.set('only_highlight_node', true)
						} else {
								$('#highlight-mode > .iconfont').removeClass('icon-highlight-mode-').addClass('icon-highlight-mode')
								Variables.set('only_highlight_node', false)
						}
				},
				//  清除在barcodeTree上的所有选择
				selection_refresh: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if (!BarcodeGlobalSetting['Align_Lock']) {
								if (Variables.get('displayMode') !== Config.get('CONSTANT').GLOBAL) {
										barcodeCollection.remove_all_selected_node()
								}
						} else {
								//  增加所有选择的节点到highlight children的数组中
								barcodeCollection.add_selected_obj_into_children_nodes()
								barcodeCollection.clear_aligned_selected_node()
						}
						self.trigger_disable_tree_selection()
						self.trigger_mouseout_event()
						self.trigger_update_distribution_view()
						//  重置对齐的参数
						self.reset_align_parameters()
				},
				// 在barcodeTree上的子树操作
				subtree_collapse: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						if (!barcodeCollection.is_selected_node_empty()) {
								var removedContainSelectedNodeIdObj = barcodeCollection.get_selected_nodes_id_removed_contain()
								for (var item in removedContainSelectedNodeIdObj) {
										var nodeObjId = item
										var nodeObjDepth = removedContainSelectedNodeIdObj[item].nodeObjDepth
										barcodeCollection.collapse_subtree(nodeObjId, nodeObjDepth)
								}
								barcodeCollection.update_data_all_view()
								$('#subtree-collapse-operation .config-button').removeClass('active')
								$('#barcode-selection #subtree-collapse').addClass('active')
						} else {
								swal("Subtree Collapse Tips", "Select the interested subtree first -> Collapse.");
						}
				},
				subtree_uncollapse: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						if (!barcodeCollection.is_selected_node_empty()) {
								var removedContainSelectedNodeIdObj = barcodeCollection.get_selected_nodes_id_removed_contain()
								for (var item in removedContainSelectedNodeIdObj) {
										var nodeObjId = item
										var nodeObjDepth = removedContainSelectedNodeIdObj[item].nodeObjDepth
										barcodeCollection.uncollapse_subtree(nodeObjId, nodeObjDepth)
								}
								barcodeCollection.update_data_all_view()
								$('#subtree-collapse-operation .config-button').removeClass('active')
								$('#barcode-selection #subtree-collapse').addClass('active')
						} else {
								swal("Subtree Expand Tips", "Select the interested subtree first -> Expand.");
						}
				},
				/**
					*  对于当前选择的比较状态的节点进行锁定
					*/
				compare_lock: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//  必须要存在对齐的部分才可以执行下面的两个选项
						if ($('#compare-lock .fa').hasClass('fa-lock')) {
								self.change_to_compare_unlock_state()
								// self.disable_sort_config_group()
								swal("Comparison Part Unlocked!", "You can change the interested subtrees", "success");
								// self.trigger_remove_locked_align_class()
						} else if ($('#compare-lock .fa').hasClass('fa-unlock')) {
								if (barcodeCollection.is_exist_align_part()) {
										self.change_to_compare_lock_state()
										// self.enable_sort_config_group()
										swal("Comparison Part Locked!", "You can make the detailed comparison!", "success")
										// self.trigger_add_locked_align_class()
								} else {
										swal("Comparison Locked Tips", "Before locking the comparison parts, please select and align the interested subtrees first.");
								}
						}

				},
				/**
					*  disabel config group中的所有按钮
					*/
				disable_sort_config_group: function () {
						var self = this
						self.disable_buttons($('#sort-operation-div #sort-desc'))
						self.disable_buttons($('#sort-operation-div #sort-asc'))
						self.disable_buttons($('#sort-operation-div #node-arrangement'))
						self.disable_buttons($('#sort-operation-div #sort-refresh'))
						self.disable_buttons($('#sort-operation-div #sort-options'))
				},
				/**
					* enable config group中的所有按钮
					*/
				enable_sort_config_group: function () {
						var self = this
						self.enable_buttons($('#sort-operation-div #sort-desc'))
						self.enable_buttons($('#sort-operation-div #sort-asc'))
						self.enable_buttons($('#sort-operation-div #node-arrangement'))
						self.enable_buttons($('#sort-operation-div #sort-refresh'))
						self.enable_buttons($('#sort-operation-div #sort-options'))
				},
				/**
					* 将比较状态切换到locked状态
					*/
				change_to_compare_lock_state: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						$('#compare-lock .fa').removeClass('fa-unlock')
						$('#compare-lock .fa').addClass('fa-lock')
						BarcodeGlobalSetting['Align_Lock'] = true
						$('#compare-lock').addClass('active')
						//  点击lock按钮之后初始化在aligned状态下选择的节点
						barcodeCollection.init_aligned_selected_node()
						//  增加所有选择的节点到highlight children的数组中
						barcodeCollection.add_selected_obj_into_children_nodes()
						barcodeCollection.clear_aligned_selected_node()
						//  更新所有的barcode视图, 在align的部分增加aligned-locked的class
						barcodeCollection.update_all_barcode_view()
				},
				/**
					* 将比较状态切换到unlocked状态
					*/
				change_to_compare_unlock_state: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						$('#compare-lock .fa').removeClass('fa-lock')
						$('#compare-lock .fa').addClass('fa-unlock')
						BarcodeGlobalSetting['Align_Lock'] = false
						$('#compare-lock').removeClass('active')
						// 清空在aligned状态下所有选择的节点
						barcodeCollection.clear_aligned_selected_node()
						//  更新所有的barcode视图, 在align的部分增加aligned-locked的class
						barcodeCollection.update_all_barcode_view()
						barcodeCollection.clear_highlight_all_children_nodes_array()
				},
				/**
					* barcodetree显示模式的控制视图
					*/
				align_mode_control: function () {
						//	将aligned的层级控制视图取消显示, 将有关子树对齐模式的控制视图展开显示
						$('.comparison-dropdown-menu').css('visibility', 'hidden')
						$('#aligned-mode-menu').css('visibility', 'visible')
				},
				/**
					* 对于选择的子树或者节点, 对齐进行比较
					*/
				align_selected_tree: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if ($('#align-selected-tree').hasClass('active')) {
								//	取消对于selected tree的对齐
								$('#align-selected-tree').removeClass('active')
								$('#align-mode-controller').removeClass('active')
								//  unalign之后 设置alignedLevel为0
								Variables.set('alignedLevel', 0)
								var fixedLevel = 0
								var alignedLevel = 1
								Variables.set('displayFixedLevel', fixedLevel)
								Variables.set('displayAlignedLevel', alignedLevel)
								// self.activeAlignedLevel(fixedLevel, alignedLevel)
								var selectedAlignedItemList = barcodeCollection.get_selected_aligned_item_list()
								barcodeCollection.remove_aligned_part(selectedAlignedItemList)
								BARCODETREE_GLOBAL_PARAS['Align_State'] = false
								self.change_to_compare_unlock_state()
								self.enable_subtree_collapse_group()
								//	取消对齐状态时, 设置segment层级为0
								Variables.set('segmentLevel', 0)
								//	取消选中子树部分的对齐, 需要将segement的状态设置为false
								BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split'] = false
						} else {
								//	对齐选中的子树部分
								$('#align-selected-tree').addClass('active')
								$('#align-mode-controller').addClass('active')
								barcodeCollection.align_node_in_selected_list()
								BARCODETREE_GLOBAL_PARAS['Align_State'] = true
								self.disable_subtree_collapse_group()
								self.update_aligned_level()
						}
				},
				/**
					* 对于barcodeTree进行全局比较
					*/
				align_whole_tree: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//  对齐barcodeTree的最深的层级
						//var Max_Real_Level = Variables.get('maxDepth')
						var Max_Real_Level = Variables.get('alignedLevel')
						var MaxDisplayedLevel = Max_Real_Level + 1
						var nodeObjId = 'node-0-root'
						var nodeObjDepth = 0
						if (!$('#align-whole-tree').hasClass('active')) {
								//	对齐全部的barcodeTree
								swal("Global Comparison Mode", "You can compare the whole hierarchical structures!", "success");
								$('#align-whole-tree').addClass('active')
								//  在设置globalcomparison的比较状态之前, 首先需要删除所有对齐部分的节点
								Variables.set('displayMode', Config.get('CONSTANT').GLOBAL)
								//  设置对齐的Align_State状态为true, 并且自动更新barcode aligned controller的状态
								BARCODETREE_GLOBAL_PARAS['Align_State'] = true
								self.change_to_compare_lock_state()
								var displayedFixedAlignedLevel = 0
								Variables.set('displayFixedLevel', displayedFixedAlignedLevel)
								Variables.set('displayAlignedLevel', MaxDisplayedLevel)
								Variables.set('alignedLevel', Max_Real_Level)
								//  设置alignedLevel时, 会自动的将barcodeTree设置为aligned的状态
								$('#align-mode-controller').addClass('active')
								self.initialize_global_selection_nodes()
						} else {
								//	取消对于BarcodeTree的对齐
								swal("Original Comparison Mode", "You can select the interested subtrees!", "success")
								Variables.set('displayMode', Config.get('CONSTANT').ORIGINAL)
								$('#align-whole-tree').removeClass('active')
								//  设置对齐的Align_State状态为true, 并且自动更新barcode aligned controller的状态
								$('#align-mode-controller').removeClass('active')
								BARCODETREE_GLOBAL_PARAS['Align_State'] = false
								self.change_to_compare_unlock_state()
								//	取消对齐状态时, 设置aligned层级以及fixed层级
								Variables.set('displayFixedLevel', 0)
								Variables.set('displayAlignedLevel', 1)
								var selectedAlignedItemList = barcodeCollection.get_selected_aligned_item_list()
								// barcodeCollection.remove_aligned_part(selectedAlignedItemList)
								Variables.set('alignedLevel', 0)
								//	取消对齐状态时, 设置segment层级为0
								Variables.set('segmentLevel', 0)
								barcodeCollection.remove_selected_node(nodeObjId, nodeObjDepth)
								//	取消对于BarcodeTree的对齐即恢复到原始的状态, 需要将segement的状态取消
								BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split'] = false
						}
				},
				/**
					* 将aligned层级的控制视图展开
					*/
				aligned_level_control: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						//	将aligned的层级控制视图取消显示, 将segment的层级控制视图展开显示
						$('.comparison-dropdown-menu').css('visibility', 'hidden')
						$('#aligned-level-menu').css('visibility', 'visible')
				},
				/**
					* 对于BarcodeTree进行切割, 其中背后包含两个步骤:
					* 1. 将BarcodeTree的切割的不同段之间增加一定的间距用来填充BarcodeTree不同部分之间的连线
					* 2. 将BarcodeTree的model中的不同部分放置到不同的object中, 然后将object放置到一个数组中, 使用数组中的元素进行依次绘制
					*/
				barcodetree_segment: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var sortingModel = self.model
						//	将segment的层级的控制视图展开, 那么就需要将aligned的层级控制视图取消显示
						$('.comparison-dropdown-menu').css('visibility', 'hidden')
						$('#segment-level-menu').css('visibility', 'visible')
						// var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						// //  根据barcodetree-segment按钮的当前状态, 对于BARCODETREE_GLOBAL_PARAS具体的参数值进行改变
						// if ($('#compare-operation #barcodetree-segment').hasClass('active')) {
						// 		$('#compare-operation #barcodetree-segment').removeClass('active')
						// 		BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split'] = false
						// } else {
						// 		$('#compare-operation #barcodetree-segment').addClass('active')
						// 		BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split'] = true
						// }
						// barcodeCollection.align_node_in_selected_list()
				},
				/**
					* 使用柱状图展示子树比较的结果
					*/
				summary_comparison: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var nodeData = null
						var operationItemList = barcodeCollection.get_operation_item()
						for (var oI = 0; oI < operationItemList.length; oI++) {
								nodeData = operationItemList[oI].nodeData
								if (typeof (nodeData) !== 'undefined') {
										var nodeObjId = nodeData.id
										self.trigger_show_summary_state(nodeObjId)
										var changeSummaryState = true
										barcodeCollection.set_summary_state(nodeObjId, changeSummaryState)
								}
						}
						if ($('#compare-operation #summary-comparison').hasClass('active')) {
								$('#compare-operation #summary-comparison').removeClass('active')
								BarcodeGlobalSetting['Comparison_Result_Display'] = false
						} else {
								$('#compare-operation #summary-comparison').addClass('active')
								BarcodeGlobalSetting['Comparison_Result_Display'] = true
								if (!$('#align-mode-controller').hasClass('active')) {
										$('#align-mode-controller').addClass('active')
										barcodeCollection.align_node_in_selected_list()
										BarcodeGlobalSetting['Align_State'] = true
										self.update_aligned_level()
										return
								}
						}
						barcodeCollection.process_barcode_model_data()
						barcodeCollection.update_data_all_view()
				},
				/**
					* 显示barcodeTree中的padding node
					*/
				showing_padding_node: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						if ($('#show-padding-node').hasClass('active')) {
								$('#show-padding-node').removeClass('active')
								Variables.set('is_show_padding_node', false)
								barcodeCollection.update_all_barcode_view()
						} else {
								$('#show-padding-node').addClass('active')
								Variables.set('is_show_padding_node', true)
								barcodeCollection.update_all_barcode_view()
						}
				},
				/**
					* 更新屏幕中的视图使得视图恢复到原始的size
					*/
				update_unfit_in_screen: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						barcodeCollection.update_unfit_in_screen()
				},
				/**
					* 改变barcode当前的显示模式
					*/
				change_subtree_display_mode: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if (!$('#change-subtree-display-mode').hasClass('active')) {
								$('#change-subtree-display-mode').addClass('active')
								BarcodeGlobalSetting['Subtree_Compact'] = true
								if (!$('#align-mode-controller').hasClass('active')) {
										$('#align-mode-controller').addClass('active')
										barcodeCollection.align_node_in_selected_list()
										BarcodeGlobalSetting['Align_State'] = true
										self.update_aligned_level()
										return
								}
								//  如果当前处于global的模式下, 点击切换到padding模式, 那么需要删除当前的horizontal fit的状态
								if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
										self.update_unfit_in_screen()
										Variables.get('BARCODETREE_GLOBAL_PARAS')['Horizontal_Fit_In_Screen'] = false
										$('#horizontal-fit-layout').removeClass('active')
										//  需要将aligned node list中的节点替换为tablelens的节点部分
										Variables.set('displayMode', Config.get('CONSTANT').ORIGINAL)
										//  删除global tree comparison的active状态
										$('#align-whole-tree').removeClass('active')
										barcodeCollection.add_tablelens_nodes_global_selection_nodes()
										//  在调用完成之后转换到original模式之后删除tablelens的所有节点
										barcodeCollection.clear_tablelens_array()
								}
						} else {
								$('#change-subtree-display-mode').removeClass('active')
								//  在global模式下 取消子树的focus状态, 那么需要删除当前的tablelens的节点
								BarcodeGlobalSetting['Subtree_Compact'] = false
								//  取消点击padding节点的情况下, 如果当前的状态为global的展示状态, 那么需要更新aligned数组中的节点
								if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
										//  清空global模式下的zoom状态
										var globalAlignedNodeObjArray = barcodeCollection.get_global_aligned_nodeobj_array()
										var nodeDataArray = []
										for (var gI = 0; gI < globalAlignedNodeObjArray.length; gI++) {
												var globalAlignNodeObj = globalAlignedNodeObjArray[gI]
												var alignedNodeId = globalAlignNodeObj['alignedNodeId']
												var alignedNodeLevel = globalAlignNodeObj['alignedNodeLevel']
												var alignedNodeCategory = globalAlignNodeObj['alignedNodeCategory']
												nodeDataArray.push({
														id: alignedNodeId,
														depth: alignedNodeLevel,
														nodeCategory: alignedNodeCategory
												})
												//  取消padding node状态的时候如果是global的状态, 那么需要还原global状态下的aligned node list中的值
												self.initialize_global_selection_nodes()
										}
										barcodeCollection.tablelens_interested_subtree(nodeDataArray)
										//  清除所有的padding Node
										barcodeCollection.clear_global_padding_node()
								}
								barcodeCollection.clear_global_padding_node()
						}
						//  在global的模式下改变barcodeTree的展示状态,
						//  其实就是将在默认模式下改变barcodeTree的展示状态拆分成更多的步骤:
						//  1. 点击tablelens BarcodeTree相当于是将将选择的节点作为默认模式下的选择节点, 此时需要进行preprocess, 计算padding节点以及align节点的范围
						//  2. 然后点击change display mode按钮相当于是在默认模式下的的change display mode, 将padding范围的节点压缩, 同时保持在zoom范围的节点的长宽
						//  3. 再次点击change display mode按钮相当于是默认模式下的change display mode
						barcodeCollection.change_subtree_display_mode()
				},
				/**
					* 更新当前对齐的层级
					*/
				update_aligned_level: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var selectedAlignedItemList = barcodeCollection.get_selected_aligned_item_list()
						for (var oI = 0; oI < selectedAlignedItemList.length; oI++) {
								if (typeof (selectedAlignedItemList[oI].nodeData) !== 'undefined') {
										//  根据选择对齐的barcode的节点层级更新当前的对齐层级, 当前的对齐层级是最深的层级
										var nodeDepth = selectedAlignedItemList[oI].nodeData.depth
										var currentAligneLevel = Variables.get('alignedLevel')
										if (currentAligneLevel < nodeDepth) {
												Variables.set('alignedLevel', nodeDepth)
										}
								}
						}
						//  更新barcode的align的层级
						self.update_aligned_level_controller(Variables.get('alignedLevel'))
						//  按照当前选择的数据集名称更新align level显示的层级
						// var currentDataSetName = Variables.get('currentDataSetName')
						// if (currentDataSetName === Config.get('DataSetCollection')['LibraryTree_DailyName']) {
						//   $('#align-level-control > #btn-5').css({visibility: 'hidden'})
						// } else if (currentDataSetName === Config.get('DataSetCollection')['NBATeamTreeName']) {
						//   $('#align-level-control > #btn-5').css({visibility: 'visible'})
						// }
				},
				// ====================================================
				// 增加当前选择的节点的icon
				add_current_selected_icon: function () {
						var self = this
						var barcodeCollection = window.Datacenter.barcodeCollection
						var operationItemList = barcodeCollection.get_operation_item()
						d3.selectAll('.select-icon').remove()
						for (var oI = 0; oI < operationItemList.length; oI++) {
								var nodeData = operationItemList[oI].nodeData
								var barcodeTreeId = operationItemList[oI].barcodeTreeId
								var srcElement = operationItemList[oI].srcElement
								var nodeObjId = nodeData.id
								self._add_single_selection_icon(srcElement, barcodeTreeId, nodeObjId)
						}
				},
				// 增加单个当前选择的节点
				_add_single_selection_icon: function (src_element, barcodeTreeId, nodeObjId) {
						var nodeX = +d3.select(src_element).attr('x')
						var nodeWidth = +d3.select(src_element).attr('width')
						var nodeY = +d3.select(src_element).attr('y')
						var nodeHeight = +d3.select(src_element).attr('height')
						var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
						var iconX = nodeX + nodeWidth / 2
						var iconY = nodeY + nodeHeight / 2
						var selectIconColor = Variables.get('select_icon_color')
						d3.select('g#' + barcodeTreeId)
								.select('#barcode-container')
								.append('text')
								.attr('text-anchor', 'middle')
								.attr('dominant-baseline', 'middle')
								.attr('cursor', 'pointer')
								.attr('class', 'select-icon')
								.attr('id', nodeObjId)
								.attr('font-family', 'FontAwesome')
								.attr('x', iconX)
								.attr('y', iconY)
								.text('\uf08d')
								.style('fill', selectIconColor)
								.style('font-size', (iconSize + 2) + 'px')
				},
				//  传入unalignedNodeItemArray, 逐个删除其对齐的状态
				_unalign_single_operation_item: function (operation_item_list, operation_index, finish_align_defer) {
						var self = this
						if ((operation_index === operation_item_list.length) || (operation_item_list.length === 0)) {
								finish_align_defer.resolve()
								return
						}
						var nodeData = operation_item_list[operation_index].nodeData
						var barcodeCollection = self.options.barcodeCollection
						barcodeCollection.uncollapse_subtree(nodeData.id, nodeData.depth)
						//  如果对齐状态的最上层父亲节点为空, 那么直接对齐当前的子树
						var finishAlignDeferObj = $.Deferred()
						$.when(finishAlignDeferObj)
								.done(function () {
										self._unalign_single_operation_item(operation_item_list, (operation_index + 1), finish_align_defer)
								})
						self._subtree_unalign_handler(nodeData, finishAlignDeferObj)
				},
				//  删除当前操作节点的align状态, 并且将当前操作节点进行更新
				subtree_operation_refresh: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var unalignItemList = barcodeCollection.get_unaligned_item()
						// var selectedUnalignedItemList = JSON.parse(JSON.stringify(unalignItemList))
						var selectedUnalignedItemList = JSON.parse(JSON.stringify(unalignItemList))
						var finishRemoveAlignDeferObj = $.Deferred()
						$.when(finishRemoveAlignDeferObj)
								.done(function () {
										// barcodeCollection.clear_operation_item()
										delete window.operated_node
										delete window.operated_tree_id
										barcodeCollection.update_all_barcode_view()
										self.trigger_super_view_update()
								})
						// self.selection_refresh()
						var operationItemList = barcodeCollection.get_operation_item()
						if (operationItemList.length === 0) {
								//  恢复到未选择align subtree时的状态
								self.enable_buttons($('#selection-operation-div .config-button'))
								self.enable_buttons($('#subtree-collapse-operation .config-button'))
								self.disable_buttons($('#compare-operation-div .config-button'))
						}
						var removeBeginIndex = 0
						self._unalign_single_operation_item(selectedUnalignedItemList, removeBeginIndex, finishRemoveAlignDeferObj)
				},
				/**
					* 取消对于子树收缩部分的点击事件
					*/
				disable_subtree_collapse_group: function () {
						var self = this
						self.disable_buttons($('#subtree-collapse .config-button'))
						self.disable_buttons($('#subtree-uncollapse .config-button'))
				},
				/**
					* 取消对于子树收缩部分的点击事件
					*/
				enable_subtree_collapse_group: function () {
						var self = this
						self.enable_buttons($('#subtree-collapse .config-button'))
						self.enable_buttons($('#subtree-uncollapse .config-button'))
				},
				//  删除子树比较的summary
				_remove_summary_comparison: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var nodeData = window.operated_node
						var operationItemList = barcodeCollection.get_operation_item()
						for (var oI = 0; oI < operationItemList.length; oI++) {
								var nodeData = operationItemList[oI].nodeData
								if (typeof (nodeData) !== 'undefined') {
										var nodeObjId = nodeData.id
										self.trigger_remove_summary_state(nodeObjId)
										var changeSummaryState = false
										barcodeCollection.set_summary_state(nodeObjId, changeSummaryState)
								}
						}
						$('#compare-operation #summary-comparison').removeClass('active')
				},
				//  对于子树进行节点数目的比较
				node_number_comparison: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var nodeData = null
						var operationItemList = barcodeCollection.get_operation_item()
						for (var oI = 0; oI < operationItemList.length; oI++) {
								nodeData = operationItemList[oI].nodeData
								if (typeof (nodeData) !== 'undefined') {
										var nodeObjId = nodeData.id
										//  当前处于节点没有比较的状态, 需要切换成当前比较的状态
										var changeNumComparisonState = true
										barcodeCollection.set_node_num_comparison_state(nodeObjId, changeNumComparisonState)
										//  重新更新barcode的节点数据, 并且更新视图
										barcodeCollection.compute_aligned_subtree_range()
								}
						}
						barcodeCollection.update_all_barcode_view()
						$('#compare-operation #node-number-comparison').addClass('active')
						self.trigger_super_view_update()
				},
				//  初始化在global的状态下选择的节点
				initialize_global_selection_nodes: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var nodeObjCategory = 'root'
						var nodeObjCategoryName = 'root'
						var siblingNodesArray = []
						var childrenNodesArray = []
						var nodeObjId = 'node-0-root'
						var nodeObjDepth = 0
						var filterModelArray = barcodeCollection.where({barcodeIndex: 0})
						if (filterModelArray.length > 0) {
								var barcodeModel = filterModelArray[0]
								var barcodeTreeId = barcodeModel.get('barcodeTreeId')
								barcodeCollection.remove_crossed_node_alignment(nodeObjId)
								barcodeCollection.add_selected_node(barcodeTreeId, nodeObjId, nodeObjDepth, nodeObjCategory, nodeObjCategoryName, siblingNodesArray, childrenNodesArray)
								//  将所有的选择的节点清空
								barcodeCollection.add_selected_obj_into_children_nodes()
						}
				}
				,
				//  删除节点数目的比较的功能
				_node_number_comparison: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var nodeData = null
						var operationItemList = barcodeCollection.get_operation_item()
						for (var oI = 0; oI < operationItemList.length; oI++) {
								nodeData = operationItemList[oI].nodeData
								if (typeof (nodeData) !== 'undefined') {
										var nodeObjId = nodeData.id
										//  当前处于节点没有比较的状态, 需要切换成当前比较的状态
										var changeNumComparisonState = false
										barcodeCollection.set_node_num_comparison_state(nodeObjId, changeNumComparisonState)
										//  重新更新barcode的节点数据, 并且更新视图
										barcodeCollection.compute_aligned_subtree_range()
								}
						}
						barcodeCollection.update_all_barcode_view()
						$('#compare-operation #node-number-comparison').removeClass('active')
						self.trigger_super_view_update()
				}
				,
				refresh_comparison: function () {
						var self = this
						self._remove_summary_comparison()
						self._node_number_comparison()
				},
				/**
					* 降序排列
					*/
				sort_desc: function () {
						var self = this
						//  将比较状态切换到锁定的状态
						// self.change_to_compare_lock_state()
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var asc_desc_para = 'desc'
						var sortOption = BarcodeGlobalSetting['Sort_Option']
						if (!((sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_DATE_SORT'])
								|| (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_DAY_SORT']))) {
								if (barcodeCollection.is_aligned_selected_node_empty()) {
										swal("Sorting Tips", "Select the interested subtree first after locking -> Sorting.");
								} else {
										self.uniform_sort_handler(asc_desc_para)
										$('#sort-operation .config-button').removeClass('active')
								}
						} else {
								self.uniform_date_sort_handler(asc_desc_para)
						}
				},
				/**
					* 升序排列
					*/
				sort_asc: function () {
						var self = this
						//  将比较状态切换到锁定的状态
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var asc_desc_para = 'asc'
						var sortOption = BarcodeGlobalSetting['Sort_Option']
						if (!((sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_DATE_SORT'])
								|| (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_DAY_SORT']))) {
								if (barcodeCollection.is_aligned_selected_node_empty()) {
										//  将比较状态切换到锁定的状态
										swal("Sorting Tips", "Select the interested subtree first after locking -> Sorting.");
								} else {
										self.uniform_sort_handler(asc_desc_para)
										// self.change_to_compare_lock_state()
										$('#sort-operation .config-button').removeClass('active')
								}
						} else {
								console.log('sort asc...')
								self.uniform_date_sort_handler(asc_desc_para)
						}
				},
				/**
					*  排列barcode中的节点的位置, 具有相似位置的节点排布在一起, 类似于matrix reordering
					*/
				node_arrangement: function () {
						var self = this
						//  node_arrangement需要完成的有两方面的内容, 一个方面是获取barcodeTree的排列顺序, 纵向上对于barcodeTree进行重新排列,
						//  另一个方面是在子树的方面对于barcodeTree进行重新排列
						//  在子树的方面对于barcodeTree进行重新排列是重新进行子树的对齐的过程
						if (!$('#node-arrangement').hasClass('active')) {
								self.change_to_arrangement()
						} else {
								self.change_to_not_arrangement()
						}
				}
				,
				//  切换到节点的非排序状态
				change_to_not_arrangement: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						$('#node-arrangement').removeClass('active')
						BarcodeGlobalSetting['Node_Arrangement'] = false
						barcodeCollection.align_node_in_selected_list()
						barcodeCollection.recover_barcode_model_sequence()
						self.trigger_super_view_update()
				}
				,
				//  切换到节点的排序状态
				change_to_arrangement: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						BarcodeGlobalSetting['Node_Arrangement'] = true
						barcodeCollection.align_node_in_selected_list()
						window.Datacenter.update_barcode_tree_reordering_sequence()
						$('#node-arrangement').addClass('active')
				},
				uniform_date_sort_handler: function (asc_desc_para) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						window.sort_state = true
						barcodeCollection.date_sort_barcode_model(asc_desc_para)
				},
				uniform_sort_handler: function (asc_desc_para) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						window.sort_state = true
						barcodeCollection.sort_barcode_model(asc_desc_para)
				}
				,
				//  恢复原始序列
				sort_refresh: function () {
						var self = this
						window.sort_state = false
						var sortingModel = self.model
						//  将比较状态切换到锁定的状态
						var barcodeCollection = self.options.barcodeCollection
						barcodeCollection.recover_barcode_model_sequence()
						self.trigger_super_view_update()
						$('#sort-operation .config-button').removeClass('active')
						//	恢复原始的顺序
						sortingModel.clear_sorting_data()
				}
				,
				//  相似性排序
				//  按照barcode比较子树之间的相似性进行排序
				similarity_resorting: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						barcodeCollection.sort_selected_barcodetree()
						$('#tree-operation .config-button').removeClass('active')
				}
				,
				//  恢复barcode按照其选择序列的排序方式
				similarity_refresh: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						barcodeCollection.resort_default_barcodetree()
						$('#tree-operation .config-button').removeClass('active')
				}
				,
				// 打开barcode节点的配置视图
				node_config_panel_toggle_handler: function () {
						if ($('#config-operation #node-config-panel-toggle').hasClass('active')) {
								$('#barcode-node-config').css({visibility: 'hidden'})
								$('#config-operation #node-config-panel-toggle').removeClass('active')
						} else {
								$('#barcode-node-config').css({visibility: 'visible'})
								$('#config-operation #node-config-panel-toggle').addClass('active')
						}
				}
				,
				//  打开barcode tree的配置视图
				tree_config_panel_toggle_handler: function () {
						var self = this
						// Variables.set('current_config_barcodeTreeId', barcodeTreeId)
						// self.trigger_update_tree_config_view()
						if ($('#config-operation #tree-config-panel-toggle').hasClass('active')) {
								$('#tree-config-div').css({visibility: 'hidden'})
								$('#config-operation #tree-config-panel-toggle').removeClass('active')
						} else {
								$('#tree-config-div').css({visibility: 'visible'})
								$('#config-operation #tree-config-panel-toggle').addClass('active')
						}
				}
				,
				//  触发点击barcodetree选择的操作
				trigger_select_group_barcodetree: function (groupId) {
						var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
						var barcodetreeSelectionArray = selectionBarcodeObject[groupId]
						Backbone.Events.trigger(Config.get('EVENTS')['SELECT_GROUP_BARCODETREE'], {
								selectionArray: barcodetreeSelectionArray
						})
				}
				,
				//  触发再次点击选中的barcodetree取消选择的操作
				trigger_unselect_group_barcodetree: function () {
						var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
						Backbone.Events.trigger(Config.get('EVENTS')['UNSELECT_GROUP_BARCODETREE'])
				}
				,
				//  初始化drop down menu保证点击其他地方的节点drop down menu不会关闭
				init_drop_down_menu: function () {
						$('.dropdown.keep-open').on({
								"shown.bs.dropdown": function () {
										this.closable = Variables.get('closable')
								},
								"click": function () {
										this.closable = Variables.get('closable')
								},
								"hide.bs.dropdown": function () {
										return Variables.get('closable')
								}
						})
				}
				,
				selection_item_handler: function (groupId) {
						var self = this
						window.current_select_group_id = groupId
						self.trigger_select_group_barcodetree(groupId)
				}
				,
				//  点击选择group的事件
				init_selection_list: function () {
						var self = this
						$('.list-group-item:not(#element-added)').click(function (e) {
								if ($(this).hasClass('active')) {
										$('.list-group-item').removeClass('active')
										var groupId = $(this).attr('id')
										window.current_select_group_id = null
										self.trigger_unselect_group_barcodetree()
								} else {
										$('.list-group-item').removeClass('active')
										$(this).addClass('active')
										var groupId = $(this).attr('id')
										window.current_select_group_id = groupId
										self.selection_item_handler(groupId)
								}
								e.stopPropagation()
						})
						$('#element-added').click(function (e) {
								var addedGroupNum = Variables.get('addedGroupNum')
								addedGroupNum = addedGroupNum + 1
								var groupId = 'group-' + addedGroupNum
								var groupNum = 0
								var groupName = 'Group' + addedGroupNum
								var extraClass = 'added-list'
								var newAdded = true
								window.current_edit_group_id = groupId
								var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
								//  对于用户没有增加实际的BArcodeTree的group,那么就会在selection中删除, 只是保留存在选择的barcodeTree的group
								for (var sItem in selectionBarcodeObject) {
										var selectedBarcodeTreeArray = selectionBarcodeObject[sItem]
										if (selectedBarcodeTreeArray.length === 0) {
												$('.list-group-item#' + sItem).remove()
										}
								}
								selectionBarcodeObject[groupId] = []
								$('#selection-group .check-icon').remove()
								//  用户新增的element group
								self._add_element_html(groupId, groupNum, groupName, newAdded, extraClass)
								Variables.set('addedGroupNum', addedGroupNum)
								$('.list-group-item').removeClass('active')
								self.trigger_unselect_group_barcodetree()
								$('#' + groupId).addClass('active')
								//  改变当前为选择barcod到barcode group的状态
								change_selection_state_to_true()
								$('#' + groupId + ' .check-icon').on('click', function () {
										//  点击的时候表示完成了选择的编辑
										//  删除在list中的check icon
										$('#' + groupId + ' .check-icon').remove()
										//  取消当前为选择barcod到barcode group的状态
										change_selection_state_to_false()
										//  current select group所表示的是当前选择的groupid, 用于高亮选择的barcodeTree
										//  点击check选择barcodeTree之后, 当前选择的barcodeTree的group的id会被记录下来
										window.current_select_group_id = groupId
								})
								$('.list-group-item#' + groupId + ' .remove-icon').on('click', function (e) {
										if (window.current_select_group_id === groupId) {
												window.current_select_group_id = null
												self.trigger_unselect_group_barcodetree()
										}
										if (window.current_edit_group_id === groupId) {
												//  取消当前为选择barcod到barcode group的状态
												change_selection_state_to_false()
												self.trigger_unselect_group_barcodetree()
										}
										var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
										delete selectionBarcodeObject[groupId]
										$('.list-group-item#' + groupId).remove()
								})
								e.stopPropagation()
						})

						//  将当前的选择状态置为true
						function change_selection_state_to_true() {
								//  当前的选择状态变成true, 所表示的是用户点击single barcode视图的响应事件
								Variables.set('selectionState', true)
								//  将single barcode view中的.bg上的cursor设置为cell模式
								d3.selectAll('.bg').attr('cursor', 'cell')
								//  当前选择状态, closable为false
								Variables.set('closable', false)
						}

						//  将当前的选择状态置为false
						function change_selection_state_to_false() {
								//  当前的选择状态变成false, 所表示的是用户点击single barcode视图的响应事件
								Variables.set('selectionState', false)
								//  current edit group所表示的是当前增加的barcode的数组
								window.current_edit_group_id = null
								//  将single barcode view中的.bg上的cursor设置为default模式
								d3.selectAll('.bg').attr('cursor', 'default')
								//  当前为非选择状态, closable为true
								Variables.set('closable', true)
						}
				}
				,
				//  增加选择的list
				add_selection_list: function (selection_list) {
						var self = this
						var addedElementArray = new Array()
						for (var dI = 0; dI < selection_list.length; dI++) {
								var dayObj = selection_list[dI]
								var dayId = dayObj.dayId
								var dayNum = dayObj.dayNum
								var dayName = dayObj.dayName
								addedElementArray.push(dayObj)
						}
						var dayNameArray = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
						addedElementArray.sort(function (a, b) {
								return dayNameArray.indexOf(a.dayName) - dayNameArray.indexOf(b.dayName)
						})
						//  删除selection group中的所有选项
						$("#selection-group .default").remove()
						for (var aI = 0; aI < addedElementArray.length; aI++) {
								var dayObj = addedElementArray[aI]
								var dayId = dayObj.dayId
								var dayNum = dayObj.dayNum
								var dayName = dayObj.dayName
								var newAdded = null
								var extraClass = 'default'
								self._add_element_html(dayId, dayNum, dayName, newAdded, extraClass)
						}
						if (window.current_select_group_id != null) {
								self.selection_item_handler(window.current_select_group_id)
						}
				}
				,
				//  与选择BarcodeTree进行交互的部分, 当点击选择的时候, 在set operation中选择的BarcodeTree的数量会发生变化
				add_set_selection_barcode: function (selectedBarcodeTreeId) {
						var self = this
						var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
						var currentEditGroupId = window.current_edit_group_id
						if (typeof (selectionBarcodeObject[currentEditGroupId]) === 'undefined') {
								selectionBarcodeObject[currentEditGroupId] = []
						} else {
								if (selectionBarcodeObject[currentEditGroupId].indexOf(selectedBarcodeTreeId) === -1) {
										selectionBarcodeObject[currentEditGroupId].push(selectedBarcodeTreeId)
								}
						}
						var selectedNum = selectionBarcodeObject[currentEditGroupId].length
						$('#' + currentEditGroupId + ' .selection-num').html(selectedNum)
				}
				,
				_add_element_html: function (dayId, dayNum, dayName, newAdded, extraClass) {
						var self = this
						var elementClass = 'list-group-item'
						if (typeof (extraClass) !== 'undefined') {
								elementClass = elementClass + ' ' + extraClass
						}
						if ($("#selection-group > #" + dayId).length > 0) {
								$("#selection-group > #" + dayId).remove()
						}
						var elementHtml = "<a href = '#' class= " + "'" + elementClass + "'" + " id='" + dayId + "'>" + "<span class='badge'>" + dayNum + "</span>" + "<span class='badge remove-icon'><i class='fa fa-times remove-cross' aria-hidden='true'></i></span>" + dayName + "</a>"
						if (newAdded) {
								elementHtml = "<a href = '#' class= " + "'" + elementClass + "'" + " id='" + dayId + "'>" + "<span class='badge selection-num'>" + dayNum + "</span>" + "<span class='badge check-icon'><i class='fa fa-check confirm-check' aria-hidden='true'></i></span>" + "<span class='badge remove-icon'><i class='fa fa-times remove-cross' aria-hidden='true'></i></span>" + dayName + "</a>"
						}
						$(elementHtml).insertBefore("#element-added")
						$('.list-group-item#' + dayId).click(function (e) {
								var groupId = $(this).attr('id')
								if ($(this).hasClass('active')) {
										$('.list-group-item').removeClass('active')
										window.current_select_group_id = null
										self.trigger_unselect_group_barcodetree()
								} else {
										$('.list-group-item').removeClass('active')
										$(this).addClass('active')
										window.current_select_group_id = groupId
										self.trigger_select_group_barcodetree(groupId)
								}
								e.stopPropagation()
						})
						$('.list-group-item#' + dayId).mouseover(function (e) {
								var groupId = $(this).attr('id')
								$('.list-group-item#' + groupId + ' .remove-icon').css({visibility: 'visible'})
								e.stopPropagation();
						})
						$('.list-group-item#' + dayId).mouseout(function (e) {
								var groupId = $(this).attr('id')
								$('.list-group-item#' + groupId + ' .remove-icon').css({visibility: 'hidden'})
								e.stopPropagation();
						})
				},
				//  交集操作的按钮
				and_operation_toggle: function () {
						var self = this
						var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
						var selectedGroupId = window.current_select_group_id
						var selectItemNameArray = Variables.get('selectItemNameArray')
						selectItemNameArray.splice(0, 0, selectedGroupId)
						if (selectedGroupId != null) {
								var selectBarcodeArray = selectionBarcodeObject[selectedGroupId]
								window.Datacenter.requestAndDataCenter(selectBarcodeArray, selectedGroupId)
						}
				},
				//  并集操作的按钮
				or_operation_toggle: function () {
						var self = this
						var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
						var selectedGroupId = window.current_select_group_id
						if (selectedGroupId != null) {
								var selectBarcodeArray = selectionBarcodeObject[selectedGroupId]
								window.Datacenter.requestOrDataCenter(selectBarcodeArray, selectedGroupId)
						}
				},
				//  补集操作的按钮
				complement_operation_toggle: function () {
						var self = this
						var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
						var selectedGroupId = window.current_select_group_id
						if (selectedGroupId != null) {
								var selectBarcodeArray = selectionBarcodeObject[selectedGroupId]
								window.Datacenter.requestOrDataCenter(selectBarcodeArray, selectedGroupId)
						}
				}
				,
		})
})
