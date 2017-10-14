TopicMatrixView = Backbone.View.extend({
    initialize: function(){
        this.initData();
        this.addListeners();
        this.initView();
        this.initInteraction();        
        this.render();
    },
    addListeners: function(){
        var _this = this;
        ObserverManager.addListener(this);
    },
    OMListen: function(message, data) {
        if (message == "ChangeFocusTopic") {
            this.topicID = data.topicID;
            this.topic = data.topic;
            this.processData();
            this.render();
        }             
    },
    initData: function(){
        this.topic = this.data.topic;
        this.topicID = this.topic.id;
        this.processData();
    },
    initInteraction:function() {
        var _this = this;
        $("#topic-matrix-reorder-btn").click(function() {
            var text = $(this).text();
            if (text == "Reorder") {
                _this.reorder();
                _this.reorderRender("reorder");
                $(this).text("Revert");
            } else if (text == "Revert") {
                _this.reorderRender();
                $(this).text("Reorder");
            }
        });
        $(this.el).on("click", ".document-bar", function(){
            var doc = $(this)[0].__data__;
            ObserverManager.post("ChangeFocusDocument", {
                document: doc
            })
        })

    },    
    processData: function() {
        this.matrixData = [];
        this.matrixDocuments = [];
        this.matrixKeywords = [];

        var keywords = this.topic.keywords;
        var documents = this.topic.documents;  

        for (var i = 0; i < documents.length; i++) {
            this.matrixDocuments.push(documents[i]);
            // console.log(documents[i])
        }
        for (var i = 0; i < keywords.length; i++) {
            this.matrixKeywords.push(keywords[i]);
        }
        for (var i = 0; i < documents.length; i++) {
            this.matrixData[i] = [];
            for (var j = 0; j < keywords.length; j++) {
                var doc = documents[i].segments;
                var word = keywords[j].word;
                var re = new RegExp(word, "g");
                var match = doc.match(re);
                this.matrixData[i][j] = 0
                if (match) {
                    this.matrixData[i][j] = match.length
                }
            }
        }

        this.reorderedMatrixData = this.matrixData.concat();
        this.reorderedMatrixDocuments = this.matrixDocuments.concat();
        this.reorderedmatrixKeywords = this.matrixKeywords.concat();
    },
    reorder: function()
    {
        var rowCount = this.matrixDocuments.length
        var columnCount = this.matrixKeywords.length
        var matrixData = this.reorderedMatrixData
        var rows = this.reorderedMatrixDocuments
        var columns = this.reorderedmatrixKeywords

        while (true){
            var isColumnOrdered = reorderColumns();
            var isRowOrdered = reorderRows();
            console.log(isColumnOrdered, isRowOrdered)
            if (isColumnOrdered && isRowOrdered) {
                break;
            }
        }

        function reorderColumns() {
            var isOrdered = true;
            var sums = [];
            for (var i = 0; i < columnCount; i++) {
                sums.push(0);
                for (var j = 0; j < rowCount; j++) {
                    sums[i] = sums[i] + Math.pow(2, rowCount-j) * matrixData[j][i];
                }
            }
            for (var i = 0; i < columnCount; i++) {
                for (var j = i + 1; j < columnCount; j++) {
                    if (sums[i] < sums[j]) {
                        exchangeColumns(i, j);
                        isOrdered = false;
                        var temp = sums[i];
                        sums[i] = sums[j];
                        sums[j] = temp;
                    }
                }
            }
            return isOrdered;
        }
        function reorderRows() {
            var isOrdered = true;
            var sums = [];
            for (var i = 0; i < rowCount; i++) {
                sums.push(0);
                for (var j = 0; j < columnCount; j++) {
                    sums[i] = sums[i] + Math.pow(2, columnCount-j) * matrixData[i][j];
                }
            }
            for (var i = 0; i < columnCount; i++) {
                for (var j = i + 1; j < rowCount; j++) {
                    if (sums[i] < sums[j]) {
                        isOrdered = false;
                        exchangeRows(i, j);
                        var temp = sums[i];
                        sums[i] = sums[j];
                        sums[j] = temp;
                    }
                }
            }
            return isOrdered;
        }
        function exchangeRows(p, q) {
            var temp = matrixData[p];
            matrixData[p] = matrixData[q];
            matrixData[q] = temp;

            temp = rows[p];
            rows[p] = rows[q];
            rows[q] = temp;
        }

        function exchangeColumns(p, q) {
            for (var i = 0; i < rowCount; i++) {
                var temp = matrixData[i][p];
                matrixData[i][p] = matrixData[i][q];
                matrixData[i][q] = temp;
            }
            var temp = columns[p];
            columns[p] = columns[q];
            columns[q] = temp;
        }        
    },
    initView: function() {
        this.svgGroup = d3.select("#" + $(this.el).attr("id")).append("g");
        this.matrixGroup = this.svgGroup.append("g")
            .attr("transform", "translate(50, 80)");
        this.keywordsGroup = this.svgGroup.append("g")
            .attr("transform", "translate(50, 80)");
        this.documentsGroup = this.svgGroup.append("g")
            .attr("transform", "translate(10, 80)");
        this.colorSchemeSize = 20;
        this.colorScheme = d3.scale.linear()
            .domain([0, this.colorSchemeSize-1])
            .range(["#f6faaa", "#9E0142"])
            .interpolate(d3.interpolateHcl);
    },
    render: function(type) {
        var _this = this;
        var barHeight = 40;
        var gridSize = 12;

        $("#topic-matrix-reorder-btn").text("Reorder")
        this.matrixGroup.html("")
        this.keywordsGroup.html("")
        this.documentsGroup.html("")

        var matrixData = this.matrixData;
        var matrixKeywords = this.matrixKeywords;
        var matrixDocuments = this.matrixDocuments;
        if (type == "reorder") {
            matrixData = this.reorderedMatrixData;
            matrixKeywords = this.reorderedmatrixKeywords;
            matrixDocuments = this.reorderedMatrixDocuments;
        }

        for (var i = 0; i < matrixData.length; i++) {
            for (var j = 0; j < matrixData[0].length; j++) {
                var count = Math.min(matrixData[i][j], this.colorSchemeSize);
                this.matrixGroup.append("rect")
                    .attr("x", j * (gridSize+1) )
                    .attr("y", i * (gridSize+1))
                    .attr("width", gridSize)
                    .attr("height", gridSize)
                    .attr("fill", this.colorScheme(count))
                    .attr("id", "matrix-rect-" + matrixDocuments[i].id + "-" + matrixKeywords[j].word);
            }
        }
        for (var i = 0; i < matrixKeywords.length; i++) {
            var value = matrixKeywords[i].prob;
            var h = mapping(value, 0, 0.05, 0, barHeight)
            this.keywordsGroup.append("rect")
                .datum(matrixKeywords[i])
                .attr("class", "bar keyword-bar")
                .attr("x", i * (gridSize+1))
                .attr("y", -h - 3)
                .attr("width", gridSize)
                .attr("height", h)
                .attr("id", "matrix-keyword-bar-" + matrixKeywords[i].word);

            var x = i * (gridSize+1) + 8, y = -h;
            this.keywordsGroup.append("text")
                .datum(matrixKeywords[i])
                .attr("class", "s-font anti-aliasing")
                .text(function(d) {
                    return d.word
                })
                .attr("transform", "rotate(-90 " + (i*(gridSize+1)+7) + "," + (-h-3) + ") translate(" + x + ", " + y + ")")
                .attr("id", "matrix-keyword-text-" + matrixKeywords[i].word); 
        }
        for (var i = 0; i < matrixDocuments.length; i++) {
            var value = matrixDocuments[i].probs[this.topicID];
            var h = mapping(value, 0, 1, 0, barHeight)
            this.documentsGroup.append("rect")
                .datum(matrixDocuments[i])
                .attr("class", "bar document-bar")
                .attr("x", barHeight - h - 3)
                .attr("y", i * (gridSize+1))
                .attr("width", h)
                .attr("height", gridSize)
                .attr("id", "matrix-document-bar-" + matrixDocuments[i].id);
        }

        // update the size of wrapper svg
        setTimeout(function() {
            var bounds = _this.svgGroup[0][0].getBoundingClientRect();
            $(_this.el).width(bounds.width + 100);
            $(_this.el).height(bounds.height + 100);            
        }, 200)

    },

    reorderRender: function(type) {
        var barHeight = 40;
        var gridSize = 12;        
        var matrixData = this.matrixData;
        var matrixKeywords = this.matrixKeywords;
        var matrixDocuments = this.matrixDocuments;
        if (type == "reorder") {
            matrixData = this.reorderedMatrixData;
            matrixKeywords = this.reorderedmatrixKeywords;
            matrixDocuments = this.reorderedMatrixDocuments;
        }
        var duration = 10000;
        for (var i = 0; i < matrixData.length; i++) {
            for (var j = 0; j < matrixData[0].length; j++) {
                d3.select("#matrix-rect-" + matrixDocuments[i].id + "-" + matrixKeywords[j].word)
                    .transition(duration)
                    .attr("x", j * (gridSize+1) )
                    .attr("y", i * (gridSize+1))
            }
        }
        var barHeight = 40;
        for (var i = 0; i < matrixKeywords.length; i++) {
            d3.select("#matrix-keyword-bar-" + matrixKeywords[i].word)
                .transition(duration)
                .attr("x", i * (gridSize+1))

            var value = matrixKeywords[i].prob;
            var h = mapping(value, 0, 0.05, 0, barHeight)                
            var x = i * (gridSize+1) + 8, y = -h;
            d3.select("#matrix-keyword-text-" + matrixKeywords[i].word)
                .transition(duration)
                .attr("transform", "rotate(-90 " + (i*(gridSize+1)+7) + "," + (-h-3) + ") translate(" + x + ", " + y + ")")
        }
        for (var i = 0; i < matrixDocuments.length; i++) {
            d3.select("#matrix-document-bar-" + matrixDocuments[i].id)
                .transition(duration)
                .attr("y", i * (gridSize+1))
        }        


    }
})