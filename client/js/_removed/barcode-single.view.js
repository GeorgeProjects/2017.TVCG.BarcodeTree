/*
 * removed from the views folder
 */ 
// 
// /**
//  * []
//  * @param  {[type]} require         [description]
//  * @param  {[type]} Mn              [description]
//  * @param  {[type]} _               [description]
//  * @param  {[type]} $               [description]
//  * @param  {[type]} Backbone        [description]
//  * @param  {[type]} d3              [description]
//  * @param  {[type]} Datacenter      [description]
//  * @param  {[type]} Config          [description]
//  * @param  {[type]} Variables       [description]
//  * @param  {[type]} SVGBase         [description]
//  * @param  {[type]} event           [description]
//  * @param  {[type]} initialize:     function(options [description]
//  * @return {[type]}                 [description]
//  */
// define([
// 	'require',
// 	'marionette',
// 	'underscore',
// 	'jquery',
// 	'backbone',
// 	'd3',
// 	'd3Tip',
// 	'datacenter',
// 	'config',
// 	'variables',
// 	'collections/barcode.collection',
// 	'views/svg-base.addon',
// ],function(require, Mn, _, $, Backbone, d3, d3Tip, Datacenter, Config, Variables, BarcodeCollection, SVGBase){
// 	'use strict';

// 	return Mn.ItemView.extend(_.extend({
// 		tagName: 'svg',
// 		index: 0,
// 		template: false, //for the itemview, we must define the template value false
// 		barcodeSingleLocation:[],
// 		attributes:{
// 			style: 'width: 100%; height: 100%;',
// 			class: 'barcode-single-div'
// 		},
// 		events:{},
// 		initialize: function(options){
// 			var self = this;
// 			var model = self.model;
// 		},
// 		draw_single_barcode: function(linear_tree, index, real_tree_index, originNodeArray){
// 			var self = this;
// 			var svg = self.d3el;//此处不能直接用id选svg，因为此时这个svg实际上还没有画出来，只能用self来找
// 			/**
// 			 * [barcodeSingleLocation description]内部包含了所有需要绘制的barcode的node的位置以及大小
// 			 * @type {[array]}
// 			 * [
// 			 * 	 {height: 20, width: 10, x: 0},
// 			 * 	 {height: 20, width: 8, x: 11.5}
// 			 * 	 ......
// 			 * ]
// 			 */
// 			var barcodeSingleLocation = self.model.attributes.barLocationArray;
// 			svg.selectAll('.barcode-rect')
// 			.data(barcodeSingleLocation)
// 			.enter()
// 			.append('rect')
// 			.attr('x',function(d,i){
// 				return +d.x;
// 			})
// 			.attr('y',0)
// 			.attr('height',function(d,i){
// 				return +d.height;
// 			})
// 			.attr('width',function(d,i){
// 				return +d.width;
// 			})
// 			.attr('fill','black');

// 			//linear_tree是unionLinearTree;
// 			//originNodeArray是get_origin_attr(index);	
// 			//draw_barcoded_tree(linear_tree, index, real_tree_index, originNodeArray);
			
// 			var originIndexX = 10;
// 			var indexWidth = 20;
// 			var indexBiasyX = 10;
// 			var originXCompute = originIndexX + indexWidth + indexBiasyX;

		
// 			//var svg = d3.select('#' + svg_id); 
			
// 			var originNodeArray = origin_node_array;
// 			//self.draw_index_box(real_tree_index,cur_tree_index);
// 			var repeat2Array = [];//repeat2Array = [];
// 			var xCompute = originXCompute;//用于累积当前方块的横坐标
// 			var acc_depth_node_num = [];//记录各个深度的结点数
// 			for (var i = 0;i <= 4;++i){
// 				acc_depth_node_num[i] = 0;
// 			}
// 			//先画条码
// 			for (var i=0;i<linear_tree.length;++i)//对于线性化的并集树中每个元素循环
// 			{
// 				acc_depth_node_num[linear_tree[i]._depth]=acc_depth_node_num[linear_tree[i]._depth]+1;
// 			}
// 			var selection = svg.selectAll(".rect_background_index-" + barcoded_tree_rectbackground_index)
// 			.data(linear_tree);
// 			selection.enter()
// 			.append('rect')
// 			.attr('class',function(d,i){
// 				return classHandler(d,i,barcoded_tree_rectbackground_index);
// 			})
// 			.attr('id',function(d,i){
// 				return idHandler(d,i,barcoded_tree_rectbackground_index);
// 			})
// 			.attr('x',function(d,i){
// 				return originNodeArray[i].x;
// 			})
// 			.attr('y',function(d,i){
// 				return rectY + barcoded_tree_biasy;
// 			})
// 			.attr('width',function(d,i){
// 				return originNodeArray[i].width;
// 			})
// 			.attr('height',function(d,i){
// 				return rectHeight;
// 			})
// 			.attr('fill',function(d,i){
// 				return fillHandler(d,i,real_tree_index,this);
// 			})
// 			.on('mouseover',function(d,i){
// 				if(d3.select(this).attr("fill") == removeColor || d3.select(this).classed('nonexisted'))//虚拟结点不允许交互
// 				{
// 					return;
// 				}
// 				mouseoverHandler(d,i,svg_id,cur_tree_index,this);
// 			})
// 			.on('mouseout',function(d,i){
// 				if(d3.select(this).attr("fill") == removeColor){
// 					return;
// 				}
// 				mouseoutHandler(d,i,svg_id,cur_tree_index);
// 			    if(d3.select(this).classed(radialSvgName)){
// 			    	var treeId = dataList[barcoded_tree_rectbackground_index].id;
// 			    	ObserverManager.post("percentage", [0 ,-1, treeId]);
// 			    }
// 			})
// 			.on('click',function(d,i){
// 				if(d3.select(this).attr("fill") == removeColor){
// 					return;
// 				}
// 				var id = d3.select(this).attr('id');
// 				clickHandlerOrigin(d, i ,id);
// 			});
// 			//--------------------------------
// 			selection.attr('class',function(d,i){
// 				return classHandler(d,i,barcoded_tree_rectbackground_index);
// 			})
// 			.attr('id',function(d,i){
// 				return idHandler(d,i,barcoded_tree_rectbackground_index);
// 			})
// 			.attr('x',function(d,i){
// 				return originNodeArray[i].x;
// 			})
// 			.attr('y',function(d,i){
// 				return rectY + barcoded_tree_biasy;
// 			})
// 			.attr('width',function(d,i){
// 				return originNodeArray[i].width;
// 			})
// 			.attr('height',function(d,i){
// 				return rectHeight;
// 			})
// 			.attr('fill',function(d,i){
// 				return fillHandler(d,i,real_tree_index,this);
// 			})
// 			.on('mouseover',function(d,i){
// 				if(d3.select(this).attr("fill") == removeColor || d3.select(this).classed('nonexisted'))//虚拟结点不允许交互
// 				{
// 					return;
// 				}
// 				mouseoverHandler(d,i,svg_id,cur_tree_index,this);
// 			})
// 			.on('mouseout',function(d,i){
// 				if(d3.select(this).attr("fill") == removeColor){
// 					return;
// 				}
// 				mouseoutHandler(d,i,svg_id,cur_tree_index);
// 			    if(d3.select(this).classed(radialSvgName)){
// 			    	var treeId = dataList[barcoded_tree_rectbackground_index].id;
// 			   		ObserverManager.post("percentage", [0 ,-1, treeId]);
// 			    }
// 			})
// 			.on('click',function(d,i){
// 				if(d3.select(this).attr("fill") == removeColor){
// 					return;
// 				}
// 				var id = d3.select(this).attr('id');
// 				var thisObj = d3.select(this);
// 				clickHandlerOrigin(d, i ,id, thisObj);
// 			});
// 			selection.exit().remove();
			
// 		},
// 		draw_index_box: function(real_tree_index, cur_tree_index){
// 			/*
// 			* @function: drawIndex绘制barcode tree 前面的index rect以及index
// 			* @parameter: null
// 			*/
			
// 			var svg = self.d3el;
// 			var indexRectBeginY = 0;//warning: rectY + barcoded_tree_biasy;

// 			var originIndexX = 10;
// 			var indexWidth = 20;

// 			var indexTextX1 = originIndexX + indexWidth / 4; //+ indexWidth * 3 / 8;
// 			var indexTextX2 = originIndexX + indexWidth / 16; //+ indexWidth * 3 / 16;
// 			var indexTextOr = originIndexX + indexWidth / 8;
// 			var indexTextY = indexRectBeginY + rectHeight * 5 / 8;
// 			svg.select('#group-' + cur_tree_index).remove();

// 				var indexGroup = svg.append('g')
// 					.attr('id','group-' + cur_tree_index);

// 				indexGroup.append('rect')
// 					.attr('class', 'index-rect')
// 					.attr('x',originIndexX)
// 					.attr('y', indexRectBeginY)
// 					.attr('width',indexWidth)
// 					.attr('height',rectHeight)
// 					.on('mouseover',function(d,i){
// 						d3.select(this).classed('this-highlight',true);
// 					})
// 					.on('mouseout',function(d,i){
// 						d3.select(this).classed('this-highlight',false);
// 					});
// 				var indexText = 0;
// 				if(svg_id == setOperationSvgName){
// 					switch(cur_tree_index){
// 						case 0:
// 							indexText = 'AND';	
// 							indexGroup.append('text')
// 								.attr('class', 'index-text')
// 								.attr('x',originIndexX)
// 								.attr('y',indexTextY)
// 								.text(indexText)
// 								.style('font-size','10px');
// 						break;
// 						case 1:
// 							indexText = 'OR';
// 							indexGroup.append('text')
// 								.attr('class','index-text')
// 								.attr('x',indexTextOr)
// 								.attr('y',indexTextY)
// 								.text(indexText)
// 								.style('font-size','10px');
// 						break;
// 					}
// 				}else if(svg_id == radialSvgName){
// 					indexText = dataList[real_tree_index].id;
// 					if(indexText < 10){
// 						indexGroup.append('text')
// 							.attr('class', 'index-text')
// 							.attr('x',indexTextX1)
// 							.attr('y',indexTextY)
// 							.text(indexText)
// 							.style('font-size','15px');
// 					}else{
// 						indexGroup.append('text')
// 							.attr('class', 'index-text')
// 							.attr('x',indexTextX2)
// 							.attr('y',indexTextY)
// 							.text(indexText)
// 							.style('font-size','15px');
// 					}
// 				}
			
// 		},
// 		idHandler: function(){
// 			/*
// 			* @function: idHandler 返回某一节点的id值
// 			* @parameter: d, i, tree_index表示的是绘制的是哪一个barcode
// 			*/
// 			/*
// 			function idHandler(d,i,tree_index,svg_id){
// 				var treeIndex = tree_index;
// 				var id = 'bar-id' + d.linear_index + "rect_background_index-" + treeIndex
// 						+ '-' + svg_id;
// 				//将continuous_repeat_time为2的节点存储下来，在存储的节点的基础上面append rect
// 				var barId = 'bar-id' + d.linear_index;
// 				if(d.continuous_repeat_time == 2){
// 					if(repeat2Array.indexOf(barId) == -1){
// 						repeat2Array.push(barId);
// 					}
// 				}
// 				return id;
// 			}
// 			*/
// 		}

// 		/*
// 		draw_grid: function(svg_id,biasx,biasy,width,height,repeattime)//repeattime决定网格的密度
// 		{
// 			var line_num=0;
// 			if (repeattime<=5)
// 			{
// 				console.log("draw_grid error");
// 			}
// 			else
// 			{
// 				if (reapttime<=20)
// 					line_num=3;
// 				else if (repeattime<=40)
// 					line_num=5;
// 				else
// 					line_num=7;
// 			}
				
// 			svg = d3.select('#'+svg_id);
// 			var group=svg.append("g")
// 						.attr("transform",function(d,i){  
// 								return "translate(" + (biasx) + "," + (biasy + rectY) + ")";  
// 							})
// 						.on("mouseover",function(d,i){
// 							d3.selectAll('.grid')
// 								.attr('fill','lightblue');
// 						})
// 						.on("click",function(d,i){
						
// 						})
// 						.on("mouseout",function(){
// 							d3.selectAll('.grid')
// 								.attr('fill','white');
// 						})
// 			//外边框
// 			var cur_button_shape=	"M" + (0) + "," + 0 +
// 									"L" + (0) + ","+ width + 
// 									"L" + (height) + ","+ width + 
// 									"L" + (height) + ","+ 0;
// 			group.append("path")	
// 					.attr('class', 'grid')							 		
// 					.attr("d",cur_button_shape)								 		
// 					.attr("stroke","black")								 		
// 					.attr("stroke-width",1)
// 					.attr("fill",function(d,i){  						
// 						return "white";  					
// 					})
// 			//左上到右下
// 			for (var i=1;i<line_num;++i)
// 			{		
// 				var cur_button_shape=	"M" + (sawToothW-sawToothWidth) + "," + rectHeight * 0.4 +
// 									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight * 0.4 + 
// 									"L" + (sawToothW-sawToothWidth) + "," + rectHeight * 0.2 +
// 									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight * 0.2 +
// 									"L" + (sawToothW-sawToothWidth) + ","+ 0 +
// 									"L" + (0-sawToothWidth) + ","+ 0 +
// 									"L" + (0-sawToothWidth) + ","+ rectHeight +
// 									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight +
// 									"L" + (sawToothW-sawToothWidth) + ","+ rectHeight * 0.8 +
// 									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight * 0.8 +
// 									"L" + (sawToothW-sawToothWidth) + ","+ rectHeight * 0.6 +
// 									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight * 0.6
		
// 				group.append("path")	
// 					.attr('class', 'grid')							 		
// 					.attr("d",cur_button_shape)								 		
// 					.attr("stroke","black")								 		
// 					.attr("stroke-width",1)
// 					.attr("fill",function(d,i){  						
// 						return "white";  					
// 					})
					
// 			}
// 			//右上到左下
// 			for (var i=1;i<line_num;++i)
// 			{				
// 				group.append("path")	
// 					.attr('class', 'grid')							 		
// 					.attr("d",cur_button_shape)								 		
// 					.attr("stroke","black")								 		
// 					.attr("stroke-width",1)
// 					.attr("fill",function(d,i){  						
// 						return "white";  					
// 					})
					
// 			}			
// 		}
// 		*/




// 	}, SVGBase));
// });