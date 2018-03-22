<div id = "tree-config-div">
				<div class = "panel-header">
        <div id = "node-label">
            <span id = 'title-panel'>Config Panel</span>
            <span id = 'control-panel'>
                <i id = "config-minimize" class="fa fa-window-minimize" aria-hidden="true"></i>
                <i id = "config-close" class="fa fa-window-close-o" aria-hidden="true"></i>
            </span>
        </div>
    </div>
    <div class = "panel-content">
        <div class = "table">
            <div id = "display-controller-container" class = "level-controller-container">
                <div id = "level-controller">Displayed Levels:</div>
                <div id = "display-level-control" class="btn-toolbar level-control" role="toolbar">
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-1"><span class="tree-config-label">1</span></span>
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-2"><span class="tree-config-label">2</span></span>
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-3"><span class="tree-config-label">3</span></span>
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-4"><span class="tree-config-label">4</span></span>
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-5"><span class="tree-config-label">5</span></span>
                    <span type="button" class="btn btn-default btn-lg" id="refresh-display-level">
                        <i class="fa fa-refresh" id="refresh-display-text"></i>
                    </span>
                </div>
            </div>
            <!--<div id = "align-controller-container" class = "level-controller-container">
                <div id = "align-controller">Aligned Levels:</div>
                <div id = "align-level-control" class="btn-toolbar level-control" role="toolbar">
                    <span type="button" class="btn level-btn btn-default btn-lg" id="btn-1">1</span>
                    <span type="button" class="btn level-btn btn-default btn-lg" id="btn-2">2</span>
                    <span type="button" class="btn level-btn btn-default btn-lg" id="btn-3">3</span>
                    <span type="button" class="btn level-btn btn-default btn-lg" id="btn-4">4</span>
                    <span type="button" class="btn level-btn btn-default btn-lg" id="btn-5">5</span>
                    <span type="button" class="btn btn-default btn-lg" id="refresh-aligned-level">
                        <span class="glyphicon glyphicon-refresh" aria-hidden="true" id="refresh-aligned-text"></span>
                    </span>
                </div>
            </div>-->
            <div id = "align-controller">Fit on Screen:</div>
            <div id = "barcode-layout-mode" class="btn-group" role="group">
                <button type="button" class="btn btn-default btn-lg mode-button" aria-label="Left Align" id="horizontal-fit-layout">
																			<!--<i class="fa icon iconfont icon-tree-uncollapse1"></i>-->
																			<i class="fa fa-arrows-h" aria-hidden="true"></i> <span class="tree-config-label">horizontal</span>
                </button>
                <button type="button" class="btn btn-default btn-lg mode-button" aria-label="Left Align" id="vertical-fit-layout">
                			<i class="fa fa-arrows-v" aria-hidden="true"></i> <span class="tree-config-label">vertical</span>
                  <!--<i class="fa icon iconfont icon-UnionLayout1" id = "union-layout"></i> <span class="tree-config-label">fit on screen</span>-->
                </button>
            </div>
            <div id = "display-controller">Display Mode:</div>
            <div id = "barcode-display-mode" class="btn-group" role="group">
                <button type="button" class="btn btn-default btn-lg mode-button active" aria-label="Left Align" id="original-display-button">
                  <i class="fa icon iconfont icon-tree-uncollapse1"></i> <span class="tree-config-label">original</span>
                </button>
                <button type="button" class="btn btn-default btn-lg mode-button" aria-label="Right Align" id="compact-display-button">
                  <i class="fa fa-th-large" aria-hidden="true" id = "compact-display"></i> <span class="tree-config-label">compact</span>
                </button>
            </div>
            <div id = "comparison-controller">Comparison Mode:</div>
            <div id = "barcode-comparison-mode" class="btn-group" role="group">
                <button type="button" class="btn btn-default btn-lg mode-button active" aria-label="Left Align" id="topological-comparison-button">
                  <i class="fa icon iconfont icon-tree-uncollapse1"></i> <span class="tree-config-label">original</span>
                </button>
                <button type="button" class="btn btn-default btn-lg mode-button" aria-label="Right Align" id="attribute-comparison-button">
                  <i class="fa icon iconfont icon-tree-attribute"></i> <span class="tree-config-label">attribute</span>
                </button>
            </div>
        </div>
    </div>
</div>