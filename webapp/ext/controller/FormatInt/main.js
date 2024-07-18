sap.ui.define([], function () {
    'use strict';
    return {
        onMain: function (value, DecimalFormat) {
            // Kiểm tra xem chuỗi có chứa cả dấu chấm
            var hasDot = value.includes('.');
            var hasComma = value.includes(',');
            if (!hasDot && !hasComma) {
                return {
                    type: 'Success',
                    outValue: value,
                    decimals: 0
                }
            } else {
                // Biểu thức chính quy phân tích đa dạng các định dạng số và đơn vị đo
                if (DecimalFormat == 'X') {
                    var number = value.match(/^[-+]?\d{1,3}(?:,\d{3})*(?:\.\d+)?$/);
                } else if (DecimalFormat == '') {
                    var number = value.match(/^[-+]?\d{1,3}(?:.\d{3})*(?:\,\d+)?$/);
                } else {
                    var number = value.match(/^\d{1,3}( \d{3})*(,\d+)?$/);
                }


                if (number) {
                    var numberPart = number[0]; // Phần số

                    // // Kiểm tra xem chuỗi có chứa cả dấu chấm và dấu phẩy hay không và vị trí của nó
                    // var hasDot = numberPart.includes('.');
                    // var hasComma = numberPart.includes(',');
                    var lastDotIndex = numberPart.lastIndexOf('.');
                    var lastCommaIndex = numberPart.lastIndexOf(',');

                    if (DecimalFormat == 'X') {
                        var outValue = numberPart.replace(/\,/g, '')
                        // Tính độ dài của phần thập phân
                        var decimals = lastDotIndex == -1 ? 0 : numberPart.substring(lastDotIndex + 1).length;
                        return {
                            type: 'Success',
                            outValue: outValue,
                            decimals: decimals
                        }
                    } else if (DecimalFormat == '') {
                        var outValuePre = numberPart.replace(/\./g, '')
                        var outValue    = outValuePre.replace(/\,/g, '.') //value default '.'
                        // Tính độ dài của phần thập phân
                        var decimals = lastCommaIndex == -1 ? 0 : numberPart.substring(lastCommaIndex + 1).length;
                        return {
                            type: 'Success',
                            outValue: outValue,
                            decimals: decimals
                        }
                    } else {
                        var outValuePre = numberPart.replace(/\s/g, '')
                        var outValue    = outValuePre.replace(/\,/g, '.') //value default '.'s
                        // Tính độ dài của phần thập phân
                        var decimals = lastCommaIndex == -1 ? 0 : numberPart.substring(lastCommaIndex + 1).length;
                        return {
                            type: 'Success',
                            outValue: outValue,
                            decimals: decimals
                        }
                    }

                    // if(hasDot && hasComma){
                    //     if(lastDotIndex > lastCommaIndex){
                    //         var outValue = numberPart.replace(/\,/g, '')
                    //         // Tính độ dài của phần thập phân
                    //         var decimals = numberPart.substring(lastDotIndex + 1).length;
                    //         return {
                    //             type: 'Success',
                    //             outValue: outValue,
                    //             decimals: decimals
                    //         }
                    //     } else {
                    //         var outValue = numberPart.replace(/\./g, '')
                    //         // Tính độ dài của phần thập phân
                    //         var decimals = numberPart.substring(lastCommaIndex + 1).length;
                    //         return {
                    //             type: 'Success',
                    //             outValue: outValue,
                    //             decimals: decimals
                    //         }
                    //     }
                    // } else if (hasDot) {
                    //     var outValue = numberPart
                    //     // Tính độ dài của phần thập phân
                    //     var decimals = numberPart.substring(lastDotIndex + 1).length;
                    //     return {
                    //         type: 'Success',
                    //         outValue: outValue,
                    //         decimals: decimals
                    //     }
                    // } else if (hasComma) {
                    //     var outValue = numberPart
                    //     // Tính độ dài của phần thập phân
                    //     var decimals = numberPart.substring(lastCommaIndex + 1).length;
                    //     return {
                    //         type: 'Success',
                    //         outValue: outValue,
                    //         decimals: decimals
                    //     }
                    // } else {
                    //     return {
                    //         type: 'Success',
                    //         outValue: numberPart,
                    //         decimals: 0
                    //     }
                    // }

                } else {
                    return {
                        type: 'Error',
                        msg: 'Wrong format'
                    }
                }
            }
        }
    }
})