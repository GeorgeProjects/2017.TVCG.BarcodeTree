<span id = "selection-operation-div" class = "config-div">
		<span class = "operation-label"> SELECTION </span>
		<span id = "barcode-selection" class="btn-group" role="group">
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="single-node-selection">
									<i class="fa fa-circle" aria-hidden="true"></i>
		    </button>
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="subtree-node-selection">
									<i class="fa fa-sitemap" aria-hidden="true"></i>
		    </button>
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="selection-refresh">
		       <i class="fa fa-refresh" aria-hidden="true"></i>
		    </button>
		</span>
</span>
<span id = "subtree-operation-div" class = "config-div">
		<span class = "operation-label">SUBTREE</span>
		<span id = "subtree-collapse-operation" class="btn-group" role="group">
						<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="subtree-collapse">
									<!--<i class="fa fa-eject" aria-hidden="true"></i>-->
									<i class="fa icon iconfont icon-tree-collapse"></i>
		    </button>
						<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="subtree-uncollapse">
									<!--<i class="fa fa-sitemap" aria-hidden="true"></i>-->
									<i class="fa icon iconfont icon-tree-uncollapse"></i>
		    </button>
		</span>
		<span id = "subtree-focus-operation" class="btn-group" role="group">
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="subtree-node-focus">
									<i class="fa fa-eye" aria-hidden="true"></i>
		    </button>
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="subtree-operation-refresh">
		       <i class="fa fa-times" aria-hidden="true"></i>
		    </button>
		</span>
</span>
<span id = "compare-operation-div" class = "config-div">
		<span class = "operation-label">COMPARISON</span>
		<span id = "compare-operation" class="btn-group" role="group">
						<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="summary-comparison" disabled>
									<i class="fa fa-align-right" aria-hidden="true"></i>
		    </button>
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="node-number-comparison" disabled>
									<!--<i class="fa fa-ellipsis-h" aria-hidden="true"></i>-->
									<i class="fa icon iconfont icon-number"></i>
		    </button>
						<button class="btn btn-default btn-lg dropdown-toggle config-button" type="button" id = "structure-comparison" data-toggle="dropdown" aria-label="Right Align" aria-haspopup="true" aria-expanded="false" disabled>
         <i class="fa icon iconfont icon-comparisonsamenode"></i> <span id = "aligned-level-text"></span> <span class="caret"></span>
       </button>
       <div class="dropdown-menu">
         <span class = "slider-label">ALIGNED LEVEL:</span>
          <div id="structure-comparison-slider" class = "slider-div"><div id="structure-custom-handle" class="ui-slider-handle"></div></div>
       </div>
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="refresh-comparison" disabled>
		       <i class="fa fa-refresh" aria-hidden="true"></i>
		    </button>

		</span>
</span>
<span id = "sort-operation-div" class = "config-div">
		<span class = "operation-label">SORTING</span>
		<span id = "sort-operation" class="btn-group" role="group">
						<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="sort-desc" disabled>
									<i class="fa fa-sort-amount-desc" aria-hidden="true"></i>
		    </button>
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Left Align" id="sort-asc" disabled>
									<i class="fa fa-sort-amount-asc" aria-hidden="true"></i>
		    </button>
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="sort-refresh" disabled>
		       <i class="fa fa-refresh" aria-hidden="true"></i>
		    </button>
		</span>
</span>
<span id = "tree-operation-div" class = "config-div">
		<span class = "operation-label">SIMILARITY</span>
		<span id = "tree-operation" class="btn-group" role="group">
						<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="similarity-resorting">
									<i class="fa fa-arrow-up" aria-hidden="true"></i>
		    </button>
		     <button class="btn btn-default btn-lg dropdown-toggle config-button" type="button" id = "similarity-range" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
         <span id = "similarity-slider-text"> 20% </span><span class="caret"></span>
       </button>
       <div class="dropdown-menu">
          <span class = "slider-label">SIMILARITY PERCENTAGE:</span>
          <div id="similarity-slider" class = "slider-div"><div id="similarity-min-handle" class="ui-slider-handle"></div><div id="similarity-max-handle" class="ui-slider-handle"></div></div>
       </div>
							<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="similarity-refresh">
		       <i class="fa fa-refresh" aria-hidden="true"></i>
		     </button>
		</span>
</span>
<span id = "config-panel" class = "config-div">
		<span class = "operation-label">CONFIG</span>
		<span id = "config-operation" class="btn-group" role="group">
						<button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="node-config-panel-toggle">
									<i class="fa fa-circle" aria-hidden="true"></i> <i class="fa  fa-pencil-square-o " aria-hidden="true"></i>
		    </button>
		    <button type="button" class="btn btn-default btn-lg config-button" aria-label="Right Align" id="tree-config-panel-toggle">
		       <i class="fa fa-sitemap" aria-hidden="true"></i> <i class="fa  fa-pencil-square-o " aria-hidden="true"></i>
		    </button>
		</span>
</span>