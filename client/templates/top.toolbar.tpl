<span id = "top-toolbar-center-span">
				<span id = "refresh-operation-div" class = "config-div">
							<button type="button" class="btn btn-primary btn-lg config-button" data-toggle = "tooltip" title = "refresh selection" aria-label="Right Align" id="selection-refresh">
							    REFRESH <i class="fa fa-refresh" aria-hidden="true"></i>
							</button>
					</span>
					<span id = "clear-operation-div" class = "config-div">
							<button type="button" class="btn btn-danger btn-lg config-button" data-toggle = "tooltip" title = "clear selection" aria-label="Right Align" id="selection-clear">
							    CLEAR <i class="fa fa-times" aria-hidden="true"></i>
							</button>
					</span>
					<span id = "compare-operation-div" class = "config-div">
							<span class = "operation-label">COMPARISON</span>
							<span id = "compare-operation" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "align selected" aria-label="Left Align" id="align-selected-tree">
											   <i class="fa icon iconfont icon-alignment"></i>
       				</button>
											<button class="btn btn-default btn-lg config-button" type="button" id = "structure-comparison" data-toggle="dropdown" aria-haspopup="false" aria-expanded="false">
					         <i class="fa icon iconfont icon-level"></i> <span id = "aligned-level-text" ></span> <span class="caret" id="adaptive"></span>
					      </button>
					      <div class="dropdown-menu comparison-dropdown-menu" id="aligned-level-menu">
					        <div id = "aligned-level-menu-container">
					            <div id = "align-level-control" class="btn-toolbar level-control" role="toolbar">
					                <!--<li class = "slider-text">level-1</li>
					                <li class = "slider-text">level-2</li>
					                <li class = "slider-text">level-3</li>
					                <li class = "slider-text">level-4</li>-->
								             <button type="button" class="btn level-btn btn-default btn-lg" id="btn-1">1</button>
								             <button type="button" class="btn level-btn btn-default btn-lg" id="btn-2">2</button>
								             <button type="button" class="btn level-btn btn-default btn-lg" id="btn-3">3</button>
								             <button type="button" class="btn level-btn btn-default btn-lg"   id="btn-4">4</button>
					            </div>
					        </div>
					      </div>
											<button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "diagonal stripe mode" aria-label="Left Align" id="diagonal-strip-mode">
														<i class="fa icon iconfont icon-disgonal-strip"></i>
							    </button>
											<button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "comparison mode" aria-label="Left Align" id="comparison-mode">
														<i class="fa icon iconfont icon-comparison"></i>
							    </button>
							</span>
					</span>
					<span id = "config-panel" class = "config-div">
							<span class = "operation-label">DISPLAY</span>
							<span id = "level-controller" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button level-controller active" data-toggle = "tooltip" title = "first level" aria-label="Right Align" id="level-controller1">L1</button>
							    <button type="button" class="btn btn-default btn-lg config-button level-controller active" data-toggle = "tooltip" title = "second level" aria-label="Right Align" id="level-controller2">L2</button>
							    <button type="button" class="btn btn-default btn-lg config-button level-controller active" data-toggle = "tooltip" title = "third level" aria-label="Right Align" id="level-controller3">L3</button>
							    <button type="button" class="btn btn-default btn-lg config-button level-controller active" data-toggle = "tooltip" title = "forth level" aria-label="Right Align" id="level-controller4">L4</button>
							</span>
							<span id = "display-mode" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "BarcodeTree in compact mode" aria-label="Right Align" id="compact-barcodetree">
															<i class="fa icon iconfont icon-compact"></i>
											</button>
							</span>
							<span id = "attribute-encoding-mode" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "BarcodeTree with attribute" aria-label="Right Align" id="height-barcodetree">
       								 <i class="fa icon iconfont icon-tree-attribute"></i>
       				</button>
       				<button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "BarcodeTree with attribute" aria-label="Right Align" id="color-barcodetree">
                <i class="fa icon iconfont icon-formatcolorfill"></i>
       				</button>
							</span>
							<span class = "operation-label">FIT IN SCREEN</span>
							<span id = "fit-screen-controller" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "fit in screen horizontally" aria-label="Right Align" id="horizontal-fit-toggle">
														<i class="fa fa-arrows-h"></i>
											</button>
							    <button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "fit in screen vertically" aria-label="Right Align" id="vertical-fit-toggle">
													 <i class="fa fa-arrows-v"></i>
							    </button>
							</span>
					</span>
					<span id = "parameter-control-operation" class = "config-div">
							<!--<button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "parameter configuration" aria-label="Right Align" id="parameter-config">
							    PARAS <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
							</button>-->
							<div class="dropdown" id="parameter-slider-controller">
         <button class="btn btn-default config-button dropdown-toggle" type="button" id="parameter-config" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
           PARAS <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
           <span class="caret"></span>
         </button>
         <ul class="dropdown-menu" aria-labelledby="parameter-config">
           <li class = "slider-item"><span class = "slider-label">Level1</span> <input type="text" class="span2" value="" data-slider-min="0" data-slider-max="255" data-slider-step="1" data-slider-value="128" data-slider-id="BC" id="level-1" data-slider-handle="triangle" /></li>
           <li class = "slider-item"><span class = "slider-label">Level2</span> <input type="text" class="span2" value="" data-slider-min="0" data-slider-max="255" data-slider-step="1" data-slider-value="128" data-slider-id="BC" id="level-2" data-slider-handle="triangle" /></li>
           <li class = "slider-item"><span class = "slider-label">Level3</span> <input type="text" class="span2" value="" data-slider-min="0" data-slider-max="255" data-slider-step="1" data-slider-value="128" data-slider-id="BC" id="level-3" data-slider-handle="triangle" /></li>
           <li class = "slider-item"><span class = "slider-label">Level4</span> <input type="text" class="span2" value="" data-slider-min="0" data-slider-max="255" data-slider-step="1" data-slider-value="128" data-slider-id="BC" id="level-4" data-slider-handle="triangle" /></li>
           <li class = "slider-item"><span class = "slider-label">Height</span> <input type="text" class="span2" value="" data-slider-min="0" data-slider-max="255" data-slider-step="1" data-slider-value="128" data-slider-id="BC" id="height" data-slider-handle="triangle" /></li>
           <li class = "slider-item"><span class = "slider-label">Interval</span> <input type="text" class="span2" value="" data-slider-min="0" data-slider-max="255" data-slider-step="1" data-slider-value="128" data-slider-id="BC" id="interval" data-slider-handle="triangle" /></li>
							    <button type="button" class="btn btn-default btn-lg" aria-label="Right Align" id="refresh-parameter">REFRESH &nbsp;<i class="fa fa-refresh"></i></button>
         </ul>
       </div>
					</span>
					<!--<span id = "config-panel" class = "config-div">
							<span class = "operation-label">DISPLAY</span>
							<span id = "config-operation" class="btn-group" role="group">
											<button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "node configuration" aria-label="Right Align" id="node-config-panel-toggle">
														<i class="fa fa-square" aria-hidden="true"></i> <i class="fa  fa-pencil-square-o " aria-hidden="true"></i>
							    </button>
							    <button type="button" class="btn btn-default btn-lg config-button" data-toggle = "tooltip" title = "tree configuration" aria-label="Right Align" id="tree-config-panel-toggle">
							       <i class="fa fa-sitemap" aria-hidden="true"></i> <i class="fa  fa-pencil-square-o " aria-hidden="true"></i>
							    </button>
							</span>
					</span>-->
		</span>
