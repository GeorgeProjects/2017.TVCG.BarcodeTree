<div id = "barcode-config-div">
    <div class = "panel-header">
        <div id = "node-label">Config Panel</div>
        <hr>
    </div>
    <div class = "panel-content">
        <div class = "table">
            <div id = "display-controller-container" class = "level-controller-container">
                <div id = "level-controller">Displayed Levels:</div>
                <div id = "display-level-control" class="btn-toolbar level-control" role="toolbar">
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-1">1</span>
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-2">2</span>
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-3">3</span>
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-4">4</span>
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-5">5</span>
                    <span type="button" class="btn btn-default btn-lg" id="refresh-display-level">
                        <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
                    </span>
                </div>
            </div>
            <div id = "align-controller-container" class = "level-controller-container">
                <div id = "align-controller">Aligned Levels:</div>
                <div id = "align-level-control" class="btn-toolbar level-control" role="toolbar">
                    <span type="button" class="btn level-btn btn-default btn-lg active" id="btn-1">1</span>
                    <span type="button" class="btn level-btn btn-default btn-lg" id="btn-2">2</span>
                    <span type="button" class="btn level-btn btn-default btn-lg" id="btn-3">3</span>
                    <span type="button" class="btn level-btn btn-default btn-lg" id="btn-4">4</span>
                    <span type="button" class="btn level-btn btn-default btn-lg" id="btn-5">5</span>
                    <span type="button" class="btn btn-default btn-lg" id="refresh-aligned-level">
                        <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
                    </span>
                </div>
            </div>
            <div id = "align-controller">Layout Mode:</div>
            <div id = "barcode-layout-mode" class="btn-group" role="group">
                <button type="button" class="btn btn-default btn-lg active" aria-label="Left Align" id="union-layout-button">
                  <i class="icon iconfont icon-UnionLayout" id = "union-layout"></i> Union
                </button>
                <button type="button" class="btn btn-default btn-lg" aria-label="Right Align" id="fisheye-layout-button">
                  <i class="icon iconfont icon-FishEyeLayout" id = "fisheye-layout"></i> FishEye
                </button>
            </div>
            <div id = "display-controller">Display Mode:</div>
            <div id = "barcode-display-mode" class="btn-group" role="group">
                <button type="button" class="btn btn-default btn-lg active" aria-label="Left Align" id="compact-display-button">
                  <i class="fa fa-th-large" aria-hidden="true" id = "compact-display"></i> Compact
                </button>
                <button type="button" class="btn btn-default btn-lg" aria-label="Right Align" id="original-display-button">
                  <i class="fa fa-pause" aria-hidden="true" id = "original-display"></i> Original
                </button>
            </div>
            <div id = "display-controller">Comparison Mode:</div>
            <div id = "barcode-display-mode" class="btn-group" role="group">
                <button type="button" class="btn btn-default btn-lg active" aria-label="Left Align" id="topological-comparison-button">
                  <i class="fa fa-sitemap" aria-hidden="true"></i> Topological
                </button>
                <button type="button" class="btn btn-default btn-lg" aria-label="Right Align" id="attribute-comparison-button">
                  <i class="fa fa-line-chart" aria-hidden="true"></i> Attribute
                </button>
            </div>
        </div>
    </div>
    <div id = "distribution-content">
        <div id = "distribution-histogram">Nodes Distribution:</div>
        <div id = "distribution-histogram-view">
        </div>
    </div>
</div>