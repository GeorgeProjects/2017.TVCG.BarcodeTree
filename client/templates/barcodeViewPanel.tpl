<div id = 'depth-change'>
	<span class="btn btn-default btn-xs" id="state-change">  
	  	<span class="glyphicon glyphicon-transfer"></span>
	</span>
	<span class="level_display_control" id="selectable" role="group">
		<!-- 此处会在barcode-panel.view中按照Variables中的sumLevel来append合适的按钮数 -->
	</span>
</div>
<div id='node-select'>
	<div id="checkbox_group">
		<label class='highlight_control'>
			<input type="checkbox" id="highlight_sibling" unchecked>sibling
		</label>
		<label class='highlight_control'>
			<input type="checkbox" id="highlight_cousin" unchecked>cousin
		</label>
	</div>
</div>
<div id="width-height-controller">
	<div class="btn-group" role="group">
		<button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" id="slider-control-width">Width
		    <span class="caret"></span><!--加上小三角-->
		</button>
		<ul class="dropdown-menu" id="width-menu">
		    <!-- 此处会在barcode-panel.view中按照Variables中的sumLevel来append合适的slider数 -->
		</ul>
	</div>
	<div class="btn-group" role="group">
		<button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" id="slider-control-height">Height
		    <span class="caret"></span><!--加上小三角-->
		</button>
		<ul class="dropdown-menu" id="height-menu">
		    <span class="height-item"></span>
		</ul>
	</div>
</div>