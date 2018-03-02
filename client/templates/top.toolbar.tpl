		<span id = "top-toolbar-center-span">
					<span id = "selection-operation-div" class = "config-div">
							<span class = "operation-label"> SELECTION </span>
							<span id = "barcode-selection" class="btn-group" role="group">
							    <button type="button" class="btn btn-default btn-lg config-button active" aria-label="Left Align" id="single-node-selection">
														<i class="fa fa-square" aria-hidden="true"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="subtree-node-selection">
														<i class="fa fa-sitemap" aria-hidden="true"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="tree-selection">
														<i class="fa icon iconfont icon-ico-lassotool-QQn-"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="selection-refresh">
							       <i class="fa fa-times" aria-hidden="true"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button active" aria-label="Right Align" id="selection-tooltip">
							       <i class="fa fa-comment" aria-hidden="true"></i>
							    </button>
							</span>
					</span>
					<span id = "subtree-operation-div" class = "config-div">
							<span class = "operation-label">SUBTREE</span>
							<span id = "subtree-collapse-operation" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="subtree-collapse">
														<!--<i class="fa fa-eject" aria-hidden="true"></i>-->
														<i class="fa icon iconfont icon-tree-collapse1"></i>
							    </button>
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="subtree-uncollapse">
														<!--<i class="fa fa-sitemap" aria-hidden="true"></i>-->
														<i class="fa icon iconfont icon-tree-uncollapse1"></i>
							    </button>
							</span>
					</span>
					<span id = "compare-operation-div" class = "config-div">
							<span class = "operation-label">COMPARISON</span>
							<span id = "compare-operation" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="compare-lock">
											   <i class="fa icon fa-unlock" aria-hidden="true"></i>
       				</button>
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="align-compare">
											   <i class="fa icon iconfont icon-compare-arrows"></i>
       				</button>
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="summary-comparison">
														<i class="fa icon iconfont icon-show-histogram"></i>
							    </button>
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="change-subtree-display-mode">
														<i class="fa icon iconfont icon-disgonal-strip"></i>
							    </button>
           <button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="global-display-controller">
              <i class="fa fa-th"></i>
           </button>
											<button class="btn btn-default btn-lg dropdown-toggle config-button" type="button" id = "structure-comparison" data-toggle="dropdown" aria-label="Left Align" aria-haspopup="true" aria-expanded="false">
					         <i class="fa icon iconfont icon-comparisonsamenode"></i> <span id = "aligned-level-text"></span> <span class="caret" id="adaptive"></span>
					       </button>
					       <div class="dropdown-menu" id="aligned-level-menu">
					        <div id = "aligned-level-menu-container">
					         <div id = "slider-label">ALIGNED LEVEL</div>
					            <div id = "align-level-control" class="btn-toolbar level-control" role="toolbar">
					                <button type="button" class="btn level-btn btn-default btn-lg" id="btn-1">1</button>
					                <button type="button" class="btn level-btn btn-default btn-lg" id="btn-2">2</button>
					                <button type="button" class="btn level-btn btn-default btn-lg" id="btn-3">3</button>
					                <button type="button" class="btn level-btn btn-default btn-lg" id="btn-4">4</button>
					                <button type="button" class="btn level-btn btn-default btn-lg" id="btn-5">5</button>
					            </div>
					          <!--<div id="structure-comparison-slider" class = "slider-div"><div id="structure-custom-handle" class="ui-slider-handle"></div></div>-->
					        </div>
					       </div>
							</span>
					</span>
					<span id = "sort-operation-div" class = "config-div">
							<span class = "operation-label">SORTING</span>
							<span id = "sort-operation" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="sort-desc">
														<i class="fa fa-sort-amount-desc" aria-hidden="true"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="sort-asc">
														<i class="fa fa-sort-amount-asc" aria-hidden="true"></i>
							    </button>
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="node-arrangement">
							       <i class="fa fa-delicious" aria-hidden="true"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="sort-refresh">
							       <i class="fa fa-refresh" aria-hidden="true"></i>
							    </button>
											<button class="btn btn-default btn-lg dropdown-toggle config-button" type="button" id = "sort-options" data-toggle="dropdown" aria-label="Left Align" aria-haspopup="true" aria-expanded="false">
					         <span id = "sort-options-text">NODENUMBER</span>&nbsp;<span class="caret" id="adaptive"></span>
					       </button>
					       <div class="dropdown-menu" id="sorting-option-menu">
					        <div id = "sorting-options-menu-container">
					          <div id = "sorting-options">SORTING OPTIONS</div>
               <div class="radio">
                 <label id="label-similarity">
                   <input type="radio" name="optionsRadios" id="options-similarity" value="DATE" checked>
                   DATE
                 </label>
               </div>
               <div class="radio">
                 <label id="label-similarity">
                   <input type="radio" name="optionsRadios" id="options-similarity" value="DAY">
                   DAY
                 </label>
               </div>
															<div class="radio">
                 <label id="label-structure">
                   <input type="radio" name="optionsRadios" id="options-structure" value="NODENUMBER">
                   NODENUMBER
                 </label>
               </div>
															<div class="radio">
                 <label id="label-attribute">
                   <input type="radio" name="optionsRadios" id="options-attribute" value="ATTRIBUTE">
                   ATTRIBUTE
                 </label>
               </div>
               <div class="radio">
                 <label id="label-similarity">
                   <input type="radio" name="optionsRadios" id="options-similarity" value="SIMILARITY">
                   SIMILARITY
                 </label>
               </div>
					        </div>
					       </div>
							</span>
					</span>
					<span id = "config-panel" class = "config-div">
							<span class = "operation-label">CONFIG</span>
							<span id = "config-operation" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="node-config-panel-toggle">
														<i class="fa fa-square" aria-hidden="true"></i> <i class="fa  fa-pencil-square-o " aria-hidden="true"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="tree-config-panel-toggle">
							       <i class="fa fa-sitemap" aria-hidden="true"></i> <i class="fa  fa-pencil-square-o " aria-hidden="true"></i>
							    </button>
							</span>
					</span>
					<span id = "set-operation-panel" class = "config-div">
							<span class = "operation-label">SET</span>
							<span id = "set-selection" class="btn-group dropdown keep-open" role="group">
											<button type="button" id="set-selection-toggle" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="item-filter-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
														<i class="fa fa-filter" aria-hidden="true"></i> <span class="caret" id="adaptive"></span>
							    </button>
											<div class="dropdown-menu keep-open" id = "filter-drop-menu">
														<div id = "list-container-scroll" >
																<span id="selection-list-title">SELECTION LIST</span>
																<div class="list-group" id = "selection-group">
																  <a href="#" class="list-group-item" id="element-added"><i class="fa fa-plus" aria-hidden="true"></i></a>
																</div>
														</div>
					      </div>
											<button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="and-operation-toggle">
														<i class="fa icon iconfont icon-jiaoji" aria-hidden="true"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="or-operation-toggle">
														<i class="fa icon iconfont icon-bingji" aria-hidden="true"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="complement-operation-toggle">
														<i class="fa icon iconfont icon-buji" aria-hidden="true"></i>
							    </button>
							</span>
					</span>
		</span>
