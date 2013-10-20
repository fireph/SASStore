(function() {
    function SASStore(inputConfig) {
        var config = {
            id: Math.random().toString(36).substring(7),
            chunkSize: 7,
            length: 100,
            itemSize: 1
        };
        var keys = Object.keys(inputConfig);
        for (var i = 0; i < keys.length; i++) {
            config[keys[i]] = inputConfig[keys[i]] || config[keys[i]];
        }
        var cachedValue;
        var prevStore = localStorage.getItem(config.id);
        var prevConfig = localStorage.getItem(config.id+"-config");
        if (prevStore && prevConfig && compareConfig(prevConfig)) {
            cachedValue = yEncToBinary(prevStore);
        } else {
            cachedValue = new Array(config.length*config.itemSize+1).join("0");
            localStorage.setItem(config.id, binaryToYEnc(cachedValue));
            localStorage.setItem(config.id+"-config", JSON.stringify(config));
        }

        /**
         * Compares the given config to the current config to see if
         * they are the same.
         * @param  {string} oldConfigString Stringified json of old config.
         * @return {boolean}                Status of if config and oldconfig are the same.
         */
        function compareConfig(oldConfigString) {
            var oldConfig = JSON.parse(oldConfigString)
            var keys = Object.keys(config);
            var same = true;
            for (var i = 0; i < keys.length; i++) {
                same = same && config[keys[i]] == oldConfig[keys[i]]
            }
            return same;
        }

        /**
         * Encodes byte array to yEnc string.
         * @param  {Array}  source Byte array to convert to yEnc.
         * @return {string}        Resulting yEnc string from byte array.
         */
        function encode(source) {
            var reserved = [0, 10, 13, 61];
            var output = '';
            var converted, ele;
            for (var i = 0; i < source.length; i++) {
                ele = source[i];
                converted = (ele + 42) % 256;
                if (reserved.indexOf(converted) < 0) {
                    output += String.fromCharCode(converted);
                } else {
                    converted = (converted + 64) % 256;
                    output += "="+ String.fromCharCode(converted);
                }
            }
            return output;
        }

        /**
         * Decodes yEnc string to byte array.
         * @param  {string} source yEnc string to decode to byte array.
         * @return {Array}         Resulting byte array from yEnc string.
         */
        function decode(source) {
            var output = [];
            var ck = false;
            var i, c;
            for (i = 0; i < source.length; i++) {
                c = source.charCodeAt(i);
                // ignore newlines
                if (c === 13 || c === 10) { continue; }
                // if we're an "=" and we haven't been flagged, set flag
                if (c === 61 && !ck) {
                    ck = true;
                    continue;
                }
                if (ck) {
                    ck = false;
                    c = c - 64;
                }
                if (c < 42 && c > 0) {
                    output.push(c + 214);
                } else {
                    output.push(c - 42);
                }
            }

            return output;
        }

        /**
         * Convert binary string to yEnc encoding
         * @param  {string} binary Binary string to convert to yEnc.
         * @return {[type]}        Resulting yEnc string from the given binary string.
         */
        function binaryToYEnc(binary) {
            var nums = [];
            for (var i = 0; i < binary.length; i += config.chunkSize) {
                if (i + config.chunkSize >= binary.length) {
                    nums.push(parseInt(binary.substring(i, binary.length),2));
                } else {
                    nums.push(parseInt(binary.substring(i, i+config.chunkSize), 2));
                }
            }
            var overTheEnd = binary.length % config.chunkSize;
            return overTheEnd + encode(nums);
        }

        /**
         * Convert yEnc encoding to binary string.
         * @param  {string} yEncData yEnc encoding to convert to binary string.
         * @return {string}          Resulting binary string from the yEnc encoding.
         */
        function yEncToBinary(yEncData) {
            var overTheEnd = yEncData[0];
            var parseData = yEncData.slice(1);
            var byteArr = decode(parseData);
            var binaryString = "";
            for (var i = 0; i < byteArr.length; i++) {
                var binaryAdd = byteArr[i].toString(2);
                var fillSize = config.chunkSize;
                if (i == byteArr.length - 1 && overTheEnd > 0) {
                    fillSize = overTheEnd;
                }
                while (binaryAdd.length < fillSize) {
                    binaryAdd = "0" + binaryAdd;
                }
                binaryString += binaryAdd;
            }
            return binaryString;
        }

        /**
         * Checks if given binary string is valid binary.
         * @param  {string} binary Binary string to check binary validity on.
         * @return {boolean}       Boolean of whether input binary is valid binary.
         */
        function checkIfBinary(binary) {
            var status = true;
            for (var i = 0; i < binary.length; i++) {
                status = status && (binary[i] == "0" || binary[i] == "1");
            }
            return status;
        }

        /**
         * Gets item value at position given.
         * @param  {number} itemNum Location to get item at.
         * @return {string}         Return binary string of item at position given.
         */
        this.getItem = function(itemNum) {
            if (itemNum*config.itemSize + config.itemSize > cachedValue.length || itemNum < 0) {
                throw "Invalid item location.";
            }
            return cachedValue.substring(itemNum*config.itemSize, itemNum*config.itemSize+config.itemSize);
        };

        /**
         * Sets item value at position given.
         * @param {number} itemNum Location to set item at.
         * @param {string} itemVal Binary string to set item to.
         */
        this.setItem = function(itemNum, itemVal) {
            if (itemVal.length != config.itemSize) {
                throw "wrong item size";
            } else if (itemNum*config.itemSize + config.itemSize > cachedValue.length || itemNum < 0) {
                throw "position out of range";
            } else if (!checkIfBinary(itemVal)) {
                throw "not binary data";
            }
            cachedValue = cachedValue.slice(0,itemNum*config.itemSize) +
                               itemVal +
                               cachedValue.slice((itemNum+1)*config.itemSize);
            localStorage.setItem(config.id, binaryToYEnc(cachedValue));
        };

        /**
         * Randomizes all binary values.
         */
        this.randomize = function() {
            var newCachedValue = "";
            for (var i = 0; i < config.length*config.itemSize; i++) {
                newCachedValue += Math.round(Math.random()).toString();
            }
            cachedValue = newCachedValue;
            localStorage.setItem(config.id, binaryToYEnc(cachedValue));
        };

        /**
         * Returns all binary string values in an array.
         * @return {Array} All binary values in an array.
         */
        this.getAll = function() {
            var retArr = [];
            for (var i = 0; i < config.length; i++) {
                var itemStr = "";
                for (var j = 0; j < config.itemSize; j++) {
                    itemStr += cachedValue[i*config.itemSize+j];
                }
                retArr.push(itemStr);
            }
            return retArr;
        };

        /**
         * Counts the occurrences of the item given in the store.
         * @param  {string} itemVal The binary string value to check occurrences for.
         * @return {number}         The number of occurrences of the given binary string.
         */
        this.countOccurrencesOf = function(itemVal) {
            var allItems = this.getAll();
            var occurrences = 0;
            for (var i = 0; i < allItems.length; i++) {
                if (itemVal == allItems[i]) {
                    occurrences += 1;
                }
            }
            return occurrences;
        };

        /**
         * Resets all binary values to 0.
         */
        this.reset = function() {
            cachedValue = new Array(config.length*config.itemSize+1).join("0");
            localStorage.setItem(config.id, binaryToYEnc(cachedValue));
        };
    }
    window.SASStore = SASStore;
})();