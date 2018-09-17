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
		'bootstrap-slider',
		'text!templates/top.toolbar.tpl'
], function (require, Mn, _, $, Backbone, d3, Datacenter, Config, Variables, Bootstrap, BootstrapSlider, Tpl) {
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
						'click #selection-clear': 'selection_clear',
						'click #selection-refresh': 'selection_refresh',
						// 子树比较
						'click #align-selected-tree': 'align_selected_tree',
						'click #structure-comparison': 'aligned_level_control',
						'click #diagonal-strip-mode': 'change_subtree_display_mode',
						'click #compact-barcodetree': 'change_compact_barcodetree',
						'click #height-barcodetree': 'change_height_encoding',
						'click #color-barcodetree': 'change_color_encoding',
						'click #horizontal-fit-toggle': 'horizontal_fit_in_screen',
						'click #vertical-fit-toggle': 'vertical_fit_in_screen',
						'click #comparison-mode': 'change_comparison_mode',
						'click #refresh-parameter': 'refresh_parameter'
				},
				initialize: function () {
						var self = this
						self.d3el = d3.select(self.el)
						self.initEvent()
						self.initGlobalObj()
						self.change_bs_tooltip()
				},
				//	初始化视图中全局的对象
				initGlobalObj: function () {
						var self = this
						self.sliderObject = {}
				},
				//  initEvent
				initEvent: function () {
						var self = this
						//  在对齐的层级以及固定的层级改变时,会自动更新
						self.listenTo(Variables, 'change:alignedLevel', self.activeAlignedLevel)
						self.listenTo(Variables, 'change:barcodeHeight', self.update_barcode_height_slider)
						self.listenTo(Variables, 'change:barcodeWidthArray', self.update_barcode_width_slider)
						self.listenTo(Variables, 'change:barcodeNodeInterval', self.update_barcode_interval_slider)
						//  更新选中的barcdoeTree的层级
						Backbone.Events.on(Config.get('EVENTS')['UPDATE_SELECTED_LEVELS'], function () {
								self.update_toolbar_align_control()
						})
						//  清空所有的选择子树时, 需要将所有的参数还原
						Backbone.Events.on(Config.get('EVENTS')['CLEAR_ALL'], function (event) {
								self.reset_all_overview_parameters()
						})
				},
				onShow: function () {
						var self = this
						//	更新barcodeTree的对齐的控制视图
						var alignedLevel = 0
						Variables.set('alignedLevel', alignedLevel)
						self.activeAlignedLevel()
						self.update_aligned_level_controller()
						self.init_slider()
						self.update_aligned_level()
						self.init_level_controller()
				},
				//	改变bootstrap的tooltip的调用方法
				change_bs_tooltip: function () {
						jQuery.fn.bstooltip = jQuery.fn.tooltip;
				},
				//  清空所有的在全局状态下的参数, 设置的是参数设置的所有的表现出的结果以及具体的参数值
				reset_all_overview_parameters: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						//	删除所有选择的节点
						barcodeCollection.remove_all_selected_node()
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//  重设对齐的参数
						Variables.set('alignedLevel', 0)
						Variables.set('selectedBarcodeTreeArray', [])
						Variables.set('filterBarcodeTreeIdArray', [])
						//  取消显示histogram
						$('#comparison-mode').removeClass('active')
						BarcodeGlobalSetting['BarcodeTree_Comparison_Mode'] = false
						//  focus+context设置为false
						$('#diagonal-strip-mode').removeClass('active')
						//  在global模式下 取消子树的focus状态, 那么需要删除当前的tablelens的节点
						BarcodeGlobalSetting['Subtree_Compact'] = false
						//  paddingNode设置为hidden
						$('#show-padding-node').removeClass('active')
						Variables.set('is_show_padding_node', false)
						//  global comparison设置为false
						BarcodeGlobalSetting['Align_State'] = false
						$('#align-mode-controller').removeClass('active')
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
				//	更新barcodeTree中节点的高度
				update_barcode_height_slider: function () {
						var self = this
						var sliderObject = self.sliderObject
						var heightSlider = sliderObject['height']
						var barcodeHeight = Variables.get('barcodeHeight')
						heightSlider.setValue(barcodeHeight)
				},
				//	更新barcodeTree中的节点的宽度
				update_barcode_width_slider: function () {
						var self = this
						var sliderObject = self.sliderObject
						var barcodeWidthArray = Variables.get('barcodeWidthArray')
						var barcodeWidthEnableArray = Variables.get('barcodeWidthEnableArray')
						for (var oI = 0; oI < barcodeWidthArray.length; oI++) {
								if (barcodeWidthEnableArray[oI]) {
										var barcodeNodeWidth = barcodeWidthArray[oI]
										var level = oI + 1
										var slider = sliderObject['level-' + level]
										slider.setValue(barcodeNodeWidth)
								}
						}
				},
				//	更新barcodeTree中的节点的间距大小
				update_barcode_interval_slider: function () {
						var self = this
						var sliderObject = self.sliderObject
						var intervalSlider = sliderObject['interval']
						var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
						intervalSlider.setValue(barcodeNodeInterval)
				},
				/**
					* 根据对齐层级的数值更新对齐层级的具体显示
					*/
				activeAlignedLevel: function () {
						var self = this
						//  选择层级的控制视图中对齐的层级
						var alignedLevel = Variables.get('alignedLevel')
						var displayAlignedLevel = alignedLevel + 1
						//  选择层级的控制视图中固定的层级
						var alignedLevelText = $('#aligned-level-text')
						alignedLevelText.text("L" + displayAlignedLevel)
						$('#aligned-level-menu #align-level-control>.btn').removeClass('active')
						for (var lI = displayAlignedLevel; lI >= 0; lI--) {
								$('#aligned-level-menu #align-level-control>#btn-' + lI).addClass('active')
						}
				},
				update_aligned_level_controller: function () {
						var self = this
						var maxDepth = Variables.get('maxDepth')
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var barcodeCollection = self.options.barcodeCollection
						$('#align-level-control>.level-btn').unbind("click")
						$('#align-level-control>.level-btn').click(function () {
								var displayLevel = +$(this).text()
								var realLevel = displayLevel - 1
								Variables.set('alignedLevel', realLevel)
								barcodeCollection.align_node_in_selected_list()
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
				/**
					* 更新参数
					*/
				refresh_parameter: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						$('#parameter-slider-controller > .dropdown-menu > #refresh_parameter').click(function (e) {
								e.stopPropagation();
						})
						var sliderObject = self.sliderObject
						var barcodeWidthEnableArray = Variables.get('barcodeWidthEnableArray')
						var originalBarcodeWidthArray = JSON.parse(JSON.stringify(Variables.get('originalBarcodeWidthArray')))
						var barcodeWidthEnableArray = Variables.get('barcodeWidthEnableArray')
						for (var oI = 0; oI < originalBarcodeWidthArray.length; oI++) {
								if (!barcodeWidthEnableArray[oI]) {	//如果当前的额状态是disable, 那么需要保持之前的width的宽度
										originalBarcodeWidthArray[oI] = window.barcodeWidthArray[oI]
								}
						}
						Variables.set('barcodeWidthArray', originalBarcodeWidthArray)
						var widthChanged = false
						for (var bI = 0; bI < window.barcodeWidthArray.length; bI++) {
								if (window.barcodeWidthArray[bI] !== originalBarcodeWidthArray[bI]) {
										widthChanged = true
										break
								}
						}
						window.barcodeWidthArray = originalBarcodeWidthArray
						if (widthChanged) {
								barcodeCollection.change_barcode_horizontal_attr()
						}
						for (var oI = 0; oI < originalBarcodeWidthArray.length; oI++) {
								if (barcodeWidthEnableArray[oI]) {
										//	如果当前的widthslider是enable的状态才需要重置sliderbar
										var barcodeNodeWidth = originalBarcodeWidthArray[oI]
										var level = oI + 1
										var slider = sliderObject['level-' + level]
										slider.setValue(barcodeNodeWidth)
								}
						}
						//	重新设置barcodeTree中节点之间的interval的数值
						var originalBarcodeNodeInterval = Variables.get('originalBarcodeNodeInterval')
						var intervalSlider = sliderObject['interval']
						intervalSlider.setValue(originalBarcodeNodeInterval)
						window.barcodeNodeInterval = originalBarcodeNodeInterval
						var intervalChanged = false
						if (Variables.get('barcodeNodeInterval') !== originalBarcodeNodeInterval) {
								intervalChanged = true
								Variables.set('barcodeNodeInterval', originalBarcodeNodeInterval)
								barcodeCollection.change_barcode_horizontal_attr()
						}
						//	重新设置barcdoeTree中节点的高度
						var originalBarcodeHeight = Variables.get('originalBarcodeHeight')
						var heightSlider = sliderObject['height']
						heightSlider.setValue(originalBarcodeHeight)
						window.barcodeHeight = originalBarcodeHeight
						var heightChanged = false
						if (Variables.get('barcodeHeight') !== originalBarcodeHeight) {
								heightChanged = true
								Variables.set('barcodeHeight', originalBarcodeHeight)
								barcodeCollection.update_barcode_node_collection_obj()
								//	更新barcodeTree的位置信息
								barcodeCollection.uniform_layout()
						}
						if (widthChanged || intervalChanged || heightChanged) {
								barcodeCollection.update_data_all_view()
						}
				},
				//  初始化sliderbar
				init_slider: function () {
						var self = this
						var sliderObject = self.sliderObject
						var barcodeCollection = self.options.barcodeCollection
						$('#parameter-slider-controller > .dropdown-menu > .slider-item').click(function (e) {
								e.stopPropagation();
						})
						var barcodeWidthArray = window.barcodeWidthArray
						var barcodeNodeWidthMinValue = Variables.get('barcodeNodeWidthMinValue')
						var barcodeNodeWidthMaxValue = Variables.get('barcodeNodeWidthMaxValue')
						var level1Slider = new BootstrapSlider("#level-1", {
								step: 1,
								value: barcodeWidthArray[0],
								min: barcodeNodeWidthMinValue,
								max: barcodeNodeWidthMaxValue
						}).on('slide', function () {
								var originalBarcodeWidthArray = Variables.get('barcodeWidthArray')
								Variables.set('barcodeWidthArray_previous', JSON.parse(JSON.stringify(originalBarcodeWidthArray)))
								originalBarcodeWidthArray[0] = level1Slider.getValue()
								window.barcodeWidthArray[0] = level1Slider.getValue()
						})
								.on('slideStop', function () {
										barcodeCollection.change_barcode_horizontal_attr()
								})
						var level2Slider = new BootstrapSlider("#level-2", {
								step: 1,
								value: barcodeWidthArray[1],
								min: barcodeNodeWidthMinValue,
								max: barcodeNodeWidthMaxValue
						}).on('slide', function () {
								var originalBarcodeWidthArray = Variables.get('barcodeWidthArray')
								Variables.set('barcodeWidthArray_previous', JSON.parse(JSON.stringify(originalBarcodeWidthArray)))
								originalBarcodeWidthArray[1] = level2Slider.getValue()
								window.barcodeWidthArray[1] = level2Slider.getValue()
						}).on('slideStop', function () {
								barcodeCollection.change_barcode_horizontal_attr()
						})
						var level3Slider = new BootstrapSlider("#level-3", {
								step: 1,
								value: barcodeWidthArray[2],
								min: barcodeNodeWidthMinValue,
								max: barcodeNodeWidthMaxValue
						}).on('slide', function () {
								var originalBarcodeWidthArray = Variables.get('barcodeWidthArray')
								Variables.set('barcodeWidthArray_previous', JSON.parse(JSON.stringify(originalBarcodeWidthArray)))
								originalBarcodeWidthArray[2] = level3Slider.getValue()
								window.barcodeWidthArray[2] = level3Slider.getValue()
						}).on('slideStop', function () {
								barcodeCollection.change_barcode_horizontal_attr()
						})
						var level4Slider = new BootstrapSlider("#level-4", {
								step: 1,
								value: barcodeWidthArray[3],
								min: barcodeNodeWidthMinValue,
								max: barcodeNodeWidthMaxValue
						}).on('slide', function () {
								var originalBarcodeWidthArray = Variables.get('barcodeWidthArray')
								Variables.set('barcodeWidthArray_previous', JSON.parse(JSON.stringify(originalBarcodeWidthArray)))
								originalBarcodeWidthArray[3] = level4Slider.getValue()
								window.barcodeWidthArray[3] = level4Slider.getValue()
						})
								.on('slideStop', function () {
										barcodeCollection.change_barcode_horizontal_attr()
								})
						var barcodeHeightValue = +Variables.get('barcodeHeight')
						var barcodeNodeHeightMinValue = Variables.get('barcodeNodeHeightMinValue')
						var barcodeNodeHeightMaxValue = Variables.get('barcodeNodeHeightMaxValue')
						var heightSlider = new BootstrapSlider("#height", {
								step: 1,
								value: barcodeHeightValue,
								min: barcodeNodeHeightMinValue,
								max: barcodeNodeHeightMaxValue
						}).on('slide', function () {
								var heightValue = heightSlider.getValue()
								var barcodeNodeHeightMinValue = Variables.get('barcodeNodeHeightMinValue')
								Variables.set('barcodeHeight', heightValue)
								//  trigger change height
								window.barcodeHeight = heightValue
						})
								.on('slideStop', function () {
										barcodeCollection.update_all_barcode_tree_node_height()
										//	更新barcodeTree的位置信息
										barcodeCollection.uniform_layout()
										barcodeCollection.update_data_all_view()
								})
						var barcodeNodeIntervalValue = Variables.get('barcodeNodeInterval')
						var barcodeNodeIntervalMinValue = Variables.get('barcodeNodeIntervalMinValue')
						var barcodeNodeIntervalMaxValue = Variables.get('barcodeNodeIntervalMaxValue')
						var intervalSlider = new BootstrapSlider("#interval", {
								step: 1,
								value: barcodeNodeIntervalValue,
								min: barcodeNodeIntervalMinValue,
								max: barcodeNodeIntervalMaxValue
						}).on('slide', function () {
								var intervalValue = intervalSlider.getValue()
								Variables.set('barcodeNodeInterval_previous', Variables.get('barcodeNodeInterval'))
								Variables.set('barcodeNodeInterval', intervalValue)
						})
								.on('slideStop', function () {
										barcodeCollection.change_barcode_horizontal_attr()
								})
						sliderObject['level-1'] = level1Slider
						sliderObject['level-2'] = level2Slider
						sliderObject['level-3'] = level3Slider
						sliderObject['level-4'] = level4Slider
						sliderObject['height'] = heightSlider
						sliderObject['interval'] = intervalSlider
						// var barcodeCollection = self.options.barcodeCollection
						// var similarityMinHandler = $("#similarity-min-handle")
						// var similarityMaxHandler = $("#similarity-max-handle")
						// var similaritySliderText = $("#similarity-slider-text")
						// var selectedSimilarityRange = Variables.get('similarityRange')
						// $("#similarity-slider").slider({
						// 		range: "true",
						// 		min: 0,
						// 		max: 100,
						// 		values: selectedSimilarityRange,
						// 		create: function () {
						// 				similarityMinHandler.text(selectedSimilarityRange[0] + "%")
						// 				similarityMaxHandler.text(selectedSimilarityRange[1] + "%")
						// 				similaritySliderText.text("0%")
						// 		},
						// 		slide: function (event, ui) {
						// 				var value = ui.values
						// 				similarityMinHandler.text(value[0] + "%")
						// 				similarityMaxHandler.text(value[1] + "%")
						// 				similaritySliderText.text(value[0] + "%-" + value[1] + "%")
						// 				barcodeCollection.filter_barcode(value)
						// 				if ((value[0] === 0) && (value[1] === 0)) {
						// 						similaritySliderText.text("0%")
						// 				}
						// 		}
						// })
				},
				//	初始化控制层次显示的按钮
				init_level_controller: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var levelController = 'level-controller'
						var selectedLevels = Variables.get('selectedLevels')
						var originalWidthArray = Variables.get('barcodeWidthArray_previous')
						var barcodeWidthEnableArray = Variables.get('barcodeWidthEnableArray')
						var sliderObject = self.sliderObject
						$('.level-controller').click(function () {
								var buttonId = $(this).attr('id')
								var levelNum = +buttonId.replace('level-controller', '')
								var realLevel = levelNum - 1
								var enableState = barcodeWidthEnableArray[realLevel]
								if ($(this).hasClass('active')) {
										$(this).removeClass('active')
										if (enableState) {
												// selectedLevels.splice(levelIndex, 1)
												barcodeWidthEnableArray[realLevel] = false
												window.barcodeWidthArray[realLevel] = 0
												sliderObject['level-' + levelNum].disable()
										}
								} else {
										$(this).addClass('active')
										if (!enableState) {
												// selectedLevels.push(realLevel)
												barcodeWidthEnableArray[realLevel] = true
												window.barcodeWidthArray[realLevel] = originalWidthArray[realLevel]
												sliderObject['level-' + levelNum].enable()
										}
								}
								// self.changeBarcodeWidthBySelectLevels()
								//  更新barcodeTree节点宽度的控制视图, 更新对齐层级的控制视图
								// self.update_barcode_node_width_control()
								//  用户选择节点之后, 对于当前展示的节点进行更新
								Variables.set('barcodeWidthArray', window.barcodeWidthArray)
								self.update_barcode_width_slider()
								window.Datacenter.updateDateCenter()
						})
				},
				/**
					* 改变barcode当前的显示模式
					*/
				change_subtree_display_mode: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if (!$('#diagonal-strip-mode').hasClass('active')) {
								$('#diagonal-strip-mode').addClass('active')
								BarcodeGlobalSetting['Subtree_Compact'] = true
								//  如果当前处于global的模式下, 点击切换到padding模式, 那么需要删除当前的horizontal fit的状态
								// if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
								// 		self.update_unfit_in_screen()
								// 		Variables.get('BARCODETREE_GLOBAL_PARAS')['Horizontal_Fit_In_Screen'] = false
								// 		$('#horizontal-fit-layout').removeClass('active')
								// 		//  需要将aligned node list中的节点替换为tablelens的节点部分
								// 		Variables.set('displayMode', Config.get('CONSTANT').ORIGINAL)
								// 		//  删除global tree comparison的active状态
								// 		$('#align-whole-tree').removeClass('active')
								// barcodeCollection.add_tablelens_nodes_global_selection_nodes()
								// //  在调用完成之后转换到original模式之后删除tablelens的所有节点
								// barcodeCollection.clear_tablelens_array()
								// }
						} else {
								$('#diagonal-strip-mode').removeClass('active')
								//  在global模式下 取消子树的focus状态, 那么需要删除当前的tablelens的节点
								BarcodeGlobalSetting['Subtree_Compact'] = false
								//  取消点击padding节点的情况下, 如果当前的状态为global的展示状态, 那么需要更新aligned数组中的节点
								// if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
								// 		//  清空global模式下的zoom状态
								// 		var globalAlignedNodeObjArray = barcodeCollection.get_global_aligned_nodeobj_array()
								// 		var nodeDataArray = []
								// 		for (var gI = 0; gI < globalAlignedNodeObjArray.length; gI++) {
								// 				var globalAlignNodeObj = globalAlignedNodeObjArray[gI]
								// 				var alignedNodeId = globalAlignNodeObj['alignedNodeId']
								// 				var alignedNodeLevel = globalAlignNodeObj['alignedNodeLevel']
								// 				var alignedNodeCategory = globalAlignNodeObj['alignedNodeCategory']
								// 				nodeDataArray.push({
								// 						id: alignedNodeId,
								// 						depth: alignedNodeLevel,
								// 						nodeCategory: alignedNodeCategory
								// 				})
								// 		}
								// 		barcodeCollection.tablelens_interested_subtree(nodeDataArray)
								// 		//  清除所有的padding Node
								// 		barcodeCollection.clear_global_padding_node()
								// }
								// barcodeCollection.clear_global_padding_node()
						}
						barcodeCollection.update_barcode_node_attr_array()
						//  在global的模式下改变barcodeTree的展示状态,
						//  其实就是将在默认模式下改变barcodeTree的展示状态拆分成更多的步骤:
						//  1. 点击tablelens BarcodeTree相当于是将将选择的节点作为默认模式下的选择节点, 此时需要进行preprocess, 计算padding节点以及align节点的范围
						//  2. 然后点击change display mode按钮相当于是在默认模式下的的change display mode, 将padding范围的节点压缩, 同时保持在zoom范围的节点的长宽
						//  3. 再次点击change display mode按钮相当于是默认模式下的change display mode
						// barcodeCollection.change_subtree_display_mode()
						barcodeCollection.update_data_all_view()
				},
				/**
					* 对于选择的子树或者节点, 对齐进行比较
					*/
				align_selected_tree: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//	将align变成一个状态
						// if ($('#align-selected-tree').hasClass('active')) {
						// 		$('#align-selected-tree').removeClass('active')
						// 		BARCODETREE_GLOBAL_PARAS.Align_State = false
						// 		Variables.set('alignedLevel', 0)
						// 		var selectedAlignedItemList = barcodeCollection.get_selected_aligned_item_list()
						// 		barcodeCollection.remove_aligned_part(selectedAlignedItemList)
						// 		BARCODETREE_GLOBAL_PARAS['Align_State'] = false
						// 		barcodeCollection.update_data_all_view()
						// }
						// else {
						// 		$('#align-selected-tree').addClass('active')
						// 		//	将对齐的状态置为true
						// 		BARCODETREE_GLOBAL_PARAS.Align_State = true
						// 		// 将aligned的层级设置为barcodeTree中选择节点的最大深度
						// 		barcodeCollection.set_aligned_level_as_max_level()
						// 		//	对齐选中的子树部分
						// 		barcodeCollection.align_node_in_selected_list()
						// 		self.update_aligned_level()
						// }
						//	将对齐的状态置为true
						BARCODETREE_GLOBAL_PARAS.Align_State = true
						// 将aligned的层级设置为barcodeTree中选择节点的最大深度
						barcodeCollection.set_aligned_level_as_max_level()
						//	对齐选中的子树部分
						barcodeCollection.align_node_in_selected_list()
						self.update_aligned_level()
				},
				//  清除在barcodeTree上的所有选择
				selection_clear: function () {
						var self = this
						Backbone.Events.trigger(Config.get('EVENTS')['CLEAR_ALL'])
						Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_ALL_NODE_SORTING_VIEW_ICON'])
				},
				//	更新在barcodeTree上的选择
				selection_refresh: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						//	删除在sorting视图中表示排序的icon
						Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_ALL_NODE_SORTING_VIEW_ICON'])
						//  重置对齐的参数
						Variables.set('alignedLevel', 0)
						//	在barcodeCollection中删除所有选择的节点
						barcodeCollection.remove_all_selected_node()
						barcodeCollection.clear_sorting_obj()
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
						//  增加所有选择的节点到highlight children的数组中
						// barcodeCollection.add_selected_obj_into_children_nodes()
						// barcodeCollection.clear_aligned_selected_node()
						//  更新所有的barcode视图, 在align的部分增加aligned-locked的class
						barcodeCollection.update_data_all_view()
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
					* 更新屏幕中的视图使得视图恢复到原始的size
					*/
				update_unfit_in_screen: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						barcodeCollection.update_unfit_in_screen()
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
				},
				/**
					* 将原始BarcodeTree改变成compact类型的BarcodeTree
					*/
				change_compact_barcodetree: function () {
						var self = this
						if ($('#compact-barcodetree').hasClass('active')) {
								$('#compact-barcodetree').removeClass('active')
						} else {
								$('#compact-barcodetree').addClass('active')
						}
				},
				/**
					* 将节点属性映射到节点的高度上
					*/
				change_height_encoding: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if ($('#height-barcodetree').hasClass('active')) {
								$('#height-barcodetree').removeClass('active')
								barcodeTreeGlobalParas['BarcodeTree_Height_Encoding'] = false
						} else {
								$('#height-barcodetree').addClass('active')
								barcodeTreeGlobalParas['BarcodeTree_Height_Encoding'] = true
						}
						barcodeCollection.update_barcode_node_collection_obj()
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
				},
				/**
					* 将节点属性映射到节点的颜色上
					*/
				change_color_encoding: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if ($('#color-barcodetree').hasClass('active')) {
								$('#color-barcodetree').removeClass('active')
								barcodeTreeGlobalParas['BarcodeTree_Color_Encoding'] = false
						} else {
								$('#color-barcodetree').addClass('active')
								barcodeTreeGlobalParas['BarcodeTree_Color_Encoding'] = true
						}
						barcodeCollection.update_barcode_node_collection_obj()
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
				},
				/**
					* 将barcodeTree在数值方向fit到屏幕空间范围内
					*/
				horizontal_fit_in_screen: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						//	更新barcodeTree的节点的节点宽度
						var barcodeNodexMaxX = +Variables.get('barcodeNodexMaxX')
						var wholeBarcodeTreeViewWidth = +$('#barcodetree-scrollpanel').width()
						var widthRatio = wholeBarcodeTreeViewWidth / barcodeNodexMaxX
						var barcodeWidthArray = window.barcodeWidthArray
						var maxBarcodeWidth = +Variables.get('maxBarcodeWidth')
						//	计算得到的最大的宽度变化比例, 将barcodeTree的宽度变换到原始的barcdoeTree的宽度大小
						var maxFitWidthRatio = maxBarcodeWidth / barcodeWidthArray[0]
						widthRatio = widthRatio > maxFitWidthRatio ? maxFitWidthRatio : widthRatio
						var fitBarcodeNodeWidthArray = []
						for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
								fitBarcodeNodeWidthArray.push(barcodeWidthArray[bI] * widthRatio)
						}

						Variables.set('barcodeWidthArray', fitBarcodeNodeWidthArray)
						window.barcodeWidthArray = fitBarcodeNodeWidthArray
						//	更新barcodeTree的节点之间的间距
						var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
						window.barcodeNodeInterval = barcodeNodeInterval * widthRatio
						Variables.set('barcodeNodeInterval', window.barcodeNodeInterval)
						barcodeCollection.change_barcode_horizontal_attr()
				},
				/**
					* 将barcodeTree在水平方向fit到屏幕空间范围内
					* 将vertical fit in screen作为一个操作
					*/
				vertical_fit_in_screen: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						// if ($('#vertical-fit-toggle').hasClass('active')) {
						// 		$('#vertical-fit-toggle').removeClass('active')
						// 		Variables.set('layoutMode', 'ORIGINAL')
						// } else {
						// 		$('#vertical-fit-toggle').addClass('active')
						// 		Variables.set('layoutMode', 'UNION')
						// }
						// window.Variables.update_barcode_attr()
						// barcodeCollection.change_layout_mode()
						//  更新在具有attribute的情况下的barcode节点高度
						// barcodeCollection.update_attribute_height()
						// barcodeCollection.updateBarcodeNodeyMaxY()
						//	计算如果将节点纵向填充到屏幕的范围内, barcodeTree的高度
						var wholeBarcodeTreeViewHeight = $('#barcodetree-scrollpanel').height()
						var barcodeTreeLength = barcodeCollection.length
						var barcodeHeight = wholeBarcodeTreeViewHeight / barcodeTreeLength
						Variables.set('barcodeHeight', barcodeHeight)
						window.barcodeHeight = barcodeHeight
						//	更新调整之后的barcodeTree的高度
						barcodeCollection.update_all_barcode_tree_node_height()
						//	更新barcodeTree的位置信息
						barcodeCollection.uniform_layout()
						barcodeCollection.update_data_all_view()
				},
				/**
					* 将barcodeTree当前的展示状态改变成比较的状态
					*/
				change_comparison_mode: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						if ($('#comparison-mode').hasClass('active')) {
								$('#comparison-mode').removeClass('active')
								Variables.get('BARCODETREE_GLOBAL_PARAS')['BarcodeTree_Comparison_Mode'] = false
						} else {
								$('#comparison-mode').addClass('active')
								Variables.get('BARCODETREE_GLOBAL_PARAS')['BarcodeTree_Comparison_Mode'] = true
						}
						Variables.set('barcodeTreeSelectionUpdate', (Variables.get('barcodeTreeSelectionUpdate') + 1) % 2)
				},
				/**
					*
					*/
				reset_parameter: function () {
						var self = this
						console.log('reset_parameter')
				}
		})
})
