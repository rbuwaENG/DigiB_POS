const utils = require("./utils");

/** CheckOut Functions **/
$(document).ready(function () {
  /**
   * handle keypad button pressed.
   * @param {string} value - The keypad value to be processed.
   * @param {boolean} isDueInput - Indicates whether the input is for due payment.
   */
  $.fn.keypadBtnPressed = function (value, isDueInput) {
    let paymentAmount = $("#payment").val();
    if (isDueInput) {
      $("#refNumber").val($("#refNumber").val() + "" + value);
    } else {
      paymentAmount = paymentAmount + "" + value;
      $("#paymentText").val(utils.moneyFormat(paymentAmount));
      $("#payment").val(paymentAmount);
      $(this).calculateChange();
    }
  };

  /**
   * Format payment amount with commas when a point is pressed
   */
  $.fn.digits = function () {
    let paymentAmount = $("#payment").val();
    $("#paymentText").val(utils.moneyFormat(paymentAmount));
    $("#payment").val(paymentAmount + ".");
    $(this).calculateChange();
  };

  /**
   * Calculate and display the balance due.
   */
  $.fn.calculateChange = function () {
    var payablePrice = $("#payablePrice").val().replace(",", "");
    var payment = $("#payment").val().replace(",", "");
    var change = payablePrice - payment;
    if (change <= 0) {
      $("#change").text(utils.moneyFormat(Math.abs(change.toFixed(2))));
      $("#confirmPayment").show();
    } else {
      $("#change").text("0");
      $("#confirmPayment").hide();
    }
  };

  var $keypadBtn = $(".keypad-btn").on("click", function () {
    const key = $(this).data("val");
    const isdue = $(this).data("isdue");
    switch(key)
    {
    case "del" : { 
      if(isdue)
      {
        $('#refNumber').val((i, val) => val.slice(0, -1));
      }
      else
      {
        $("#payment").val((i, val) => val.slice(0, -1));
      //re-format displayed amount after deletion 
      $("#paymentText").val((i, val) => utils.moneyFormat($("#payment").val()));
      }
      $(this).calculateChange()
    }; break;

    case "ac":{
      if(isdue)
      {
          $('#refNumber').val('');
      }
      else
      {
        $('#payment,#paymentText').val('');
        $(this).calculateChange();
      }
       
    };break;

  case "point": {
    $(this).digits()
    };break;

   default: $(this).keypadBtnPressed(key, isdue); break;
  }
});

  // Handle decimal point button (not in keypad-btn class)
  $("button[data-val='.']").on("click", function () {
    $(this).digits();
  });

  /** Switch Views for Payment Options **/
  var $list = $(".list-group-item").on("click", function () {
    $list.removeClass("active");
    $(this).addClass("active");
    if (this.id == "check") {
      $("#cardInfo").show();
      $("#cardInfo .input-group-addon").text("Check Info");
    } else if (this.id == "card") {
      $("#cardInfo").show();
      $("#cardInfo .input-group-addon").text("Card Info");
    } else if (this.id == "cash") {
      $("#cardInfo").hide();
    }
  });

  /** Handle keyboard input for payment field **/
  $("#paymentText").on("input", function() {
    let inputValue = $(this).val();
    // Remove any non-numeric characters except decimal point
    let cleanValue = inputValue.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    let parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Update both fields
    $("#payment").val(cleanValue);
    $("#paymentText").val(utils.moneyFormat(cleanValue));
    
    // Calculate change
    $(this).calculateChange();
  });

  /** Auto-focus payment field when payment modal opens **/
  $("#paymentModal").on("shown.bs.modal", function () {
    $("#paymentText").focus();
  });

  /** Handle special keys for payment field **/
  $("#paymentText").on("keydown", function(e) {
    // Allow: backspace, delete, tab, escape, enter, arrow keys, ctrl/cmd+A, ctrl/cmd+C, ctrl/cmd+X, ctrl/cmd+V
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 || 
        (e.keyCode >= 35 && e.keyCode <= 40) || 
        ((e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88) && (e.ctrlKey === true || e.metaKey === true))) {
      return;
    }
    
    // Allow numbers (0-9) and decimal point
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105) || e.keyCode === 190 || e.keyCode === 110) {
      return;
    }
    
    // Prevent all other keys
    e.preventDefault();
  });
});