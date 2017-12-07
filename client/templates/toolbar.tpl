<nav class="navbar navbar-inverse navbar-static-top" id="toolbar-navbar">
    <div class="container" id="toolbar-container">
        <a class="navbar-brand" href="#" id="toolbar-navbar-brand">BarcodedTree</a>
        <div class="collapse navbar-collapse" id="options-container">
            <ul class="nav navbar-nav">
                <li class = 'active'>
                    <a href="#" id = "mode-controller" class="dropdown-toggle toolbar-a" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Comparison</span></a>
                </li>
                <li class="dropdown" id = "comparison-dataset-open">
                    <a href="#" class="dropdown-toggle toolbar-a" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i class="fa fa-folder-open" aria-hidden="true"></i>&nbsp;Open <span class="caret"></span></a>
                    <ul class="dropdown-menu" id="dataset-collection">
                        <li><a href="#" id="daily-record-tree"><i class="fa fa-file" aria-hidden="true"></i>&nbsp; DailyRecordTree<span id='DailyRecordTree' class='span-alignment-right dataset-check-icon'><i class="fa fa-check" aria-hidden="true"></i></span></a></li>
                        <li><a href="#" id="record-tree"><i class="fa fa-file" aria-hidden="true"></i>&nbsp; RecordTree<span id='RecordTree' class='span-alignment-right dataset-check-icon'><i class="fa fa-check" aria-hidden="true"></i></span></a></li>
                        <li><a href="#" id="signal-tree"><i class="fa fa-file" aria-hidden="true"></i>&nbsp; SignalTree<span id='SignalTree' class='span-alignment-right dataset-check-icon'><i class="fa fa-check" aria-hidden="true"></i></span></a></li>
                        <li role="separator" class="divider"></li>
                        <li><a href="#" id="upload-data"><i class="fa fa-upload" aria-hidden="true"></i>&nbsp; upload</a></li>
                    </ul>
                </li>
                <li class="dropdown" id = "comparison-display-mode-control">
                    <a href="#" class="dropdown-toggle toolbar-a" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i class="fa fa-barcode" aria-hidden="true"></i>&nbsp;Config <span class="caret"></span></a>
                    <ul class="dropdown-menu">
                        <li><a href="#" id="original-mode"><i class="fa fa-pause" aria-hidden="true"></i>&nbsp; original mode<span id='original' class='span-alignment-right mode-check-icon'><i class="fa fa-check barcode-mode-check-icon" id="original" aria-hidden="true"></i></span></a></li>
                        <li><a href="#" id="compact-mode"><i class="fa fa-th-large" aria-hidden="true"></i>&nbsp; compact mode<span id='compact' class='span-alignment-right mode-check-icon'><i class="fa fa-check barcode-mode-check-icon" aria-hidden="true"></i></span></a></li>
                        <li role="separator" class="divider"></li>
                        <li class="dropdown-submenu" id="height-controller">
                            <a tabindex="-1" href="#"><i class="fa fa-arrows-v" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;height</a>
                            <ul class="dropdown-menu" id="height-controller-menu">
                                <li><a href="#" id="height-controller" class="level-a">
                                    <div id='height-controller-slider'><div id='height-controller-custom-handle' class='ui-slider-handle'></div></div>
                                </a></li>
                            </ul>
                        </li>
                        <li class="dropdown-submenu" id="width-controller">
                            <a tabindex="-1" href="#"><i class="fa fa-arrows-h" aria-hidden="true"></i>&nbsp;width</a>
                            <ul class="dropdown-menu" id="width-controller-menu">
                            </ul>
                        </li>
                        <li role="separator" class="divider"></li>
                        <li class="dropdown-submenu" id="tolerance-controller">
                            <a tabindex="-1" href="#"><i class="fa fa-arrows-h" aria-hidden="true"></i>&nbsp;Compact Tolerance</a>
                            <ul class="dropdown-menu" id="tolerance-controller-menu">
                                <li><a href="#" id="tolerance-controller" class="level-a">
                                    <div id='tolerance-controller-slider'><div id='tolerance-controller-custom-handle' class='ui-slider-handle'></div></div>
                                </a></li>
                            </ul>
                        </li>
                         <li role="separator" class="divider"></li>
                         <li class="dropdown-submenu" id="barcode-type-controller">
                             <a tabindex="-1" href="#"><i class="fa fa-arrows-h" aria-hidden="true"></i>&nbsp;Barcode Type</a>
                             <ul class="dropdown-menu" id="barcode-category">
                                 <li><a href="#" id="single-tree"><i class="fa fa-file" aria-hidden="true"></i>&nbsp; SingleTree<span id='single' class='span-alignment-right barcodetype-check-icon'><i class="fa fa-check" aria-hidden="true"></i></span></a></li>
                                 <li><a href="#" id="super-tree"><i class="fa fa-file" aria-hidden="true"></i>&nbsp; SuperTree<span id='super' class='span-alignment-right barcodetype-check-icon'><i class="fa fa-check" aria-hidden="true"></i></span></a></li>
                             </ul>
                         </li>
                    </ul>
                </li>
                <li class="dropdown" id = "single-sample-file-open">
                    <a href="#" class="dropdown-toggle toolbar-a" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i class="fa fa-folder-open" aria-hidden="true"></i>&nbsp;sample <span class="caret"></span></a>
                    <ul class="dropdown-menu" id="sample-file-collection">
                        <li><a href="#" id="sample-high"><i class="fa fa-file" aria-hidden="true"></i>&nbsp; sample1(high)<span id='DailyRecordTree' class='span-alignment-right dataset-check-icon'><i class="fa fa-check" aria-hidden="true"></i></span></a></li>
                        <li><a href="#" id="sample-low"><i class="fa fa-file" aria-hidden="true"></i>&nbsp; sample2(low)<span id='RecordTree' class='span-alignment-right dataset-check-icon'><i class="fa fa-check" aria-hidden="true"></i></span></a></li>
                        <li><a href="#" id="sample-wide"><i class="fa fa-file" aria-hidden="true"></i>&nbsp; sample3(wide)<span id='SignalTree' class='span-alignment-right dataset-check-icon'><i class="fa fa-check" aria-hidden="true"></i></span></a></li>
                        <li><a href="#" id="sample-narrow"><i class="fa fa-file" aria-hidden="true"></i>&nbsp; sample4(narrow)<span id='RepostingTree' class='span-alignment-right dataset-check-icon'><i class="fa fa-check" aria-hidden="true"></i></span></a></li>
                    </ul>
                </li>
                <li id = "single-sample-file-upload" style = "display: none">
                    <a href="#" id = "upload-controller" class="dropdown-toggle toolbar-a" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">upload</span></a>
                </li>
            </ul>
            <ul class="nav navbar-nav float-right">
                <li class="dropdown">
                    <a href="#" class="dropdown-toggle toolbar-a" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i class="fa fa-adjust" aria-hidden="true"></i>&nbsp;Black <span class="caret"></span></a>
                    <ul class="dropdown-menu">
                        <li><a href="#">Black</a></li>
                        <li role="separator" class="divider"></li>
                        <li><a href="#">White</a></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>
