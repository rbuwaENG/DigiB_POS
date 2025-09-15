const jsPDF = require("jspdf");
const html2canvas = require("html2canvas");
const JsBarcode = require("jsbarcode");
const macaddress = require("macaddress");
const notiflix = require("notiflix");
const validator = require("validator");
const DOMPurify = require("dompurify");
const _ = require("lodash");
let fs = require("fs");
let path = require("path");
let moment = require("moment");
let { ipcRenderer } = require("electron");
// Ensure i18next is safely available even if not yet loaded
if (typeof window !== 'undefined' && typeof window.i18next === 'undefined') {
  window.i18next = {
    t: function (key, arg2) {
      // when called as t(key, 'fallback') or t(key, {vars})
      return typeof arg2 === 'string' ? arg2 : key;
    },
    isInitialized: false,
  };
}
let dotInterval = setInterval(function () {
  $(".dot").text(".");
}, 3000);
let Store = require("electron-store");
const remote = require("@electron/remote");
const app = remote.app;
let cart = [];
let index = 0;
let allUsers = [];
let allProducts = [];
let allCategories = [];
let allTransactions = [];
let sold = [];
let state = [];
let sold_items = [];
let item;
let auth;
let holdOrder = 0;
let vat = 0;
let perms = null;
let deleteId = 0;
let paymentType = 0;
let receipt = "";
let totalVat = 0;
let subTotal = 0;
let method = "";
let order_index = 0;
let user_index = 0;
let product_index = 0;
let transaction_index;
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;
let host = "localhost";
let port = process.env.PORT;
let img_path = path.join(appData, appName, "uploads", "/");
let api = "http://" + host + ":" + port + "/api/";
const bcrypt = require("bcrypt");
let categories = [];
let holdOrderList = [];
let customerOrderList = [];
let ownUserEdit = null;
let totalPrice = 0;
let orderTotal = 0;
let auth_error = "Incorrect username or password";
let auth_empty = "Please enter a username and password";
let holdOrderlocation = $("#renderHoldOrders");
let customerOrderLocation = $("#renderCustomerOrders");

// Helper function to safely get currency symbol
function getCurrencySymbol() {
  return settings && settings.symbol ? validator.unescape(settings.symbol) : '$';
}

// Helper function to safely get VAT percentage
function getVATPercentage() {
  return settings && settings.percentage ? validator.unescape(settings.percentage) : '0';
}
let storage = new Store();
let settings;
let platform;
let user = {};
let start = moment().startOf("month");
let end = moment();
let start_date = moment(start).toDate();
let end_date = moment(end).toDate();
let by_till = 0;
let by_user = 0;
let by_status = 1;
const default_item_img = path.join("assets","images","default.jpg");
const permissions = [
  "perm_products",
  "perm_categories",
  "perm_transactions",
  "perm_users",
  "perm_settings",
  "perm_suppliers",
];
notiflix.Notify.init({
  position: "right-top",
  cssAnimationDuration: 600,
  messageMaxLength: 150,
  clickToClose: true,
  closeButton: true
});
const {
  DATE_FORMAT,
  moneyFormat,
  isExpired,
  daysToExpire,
  getStockStatus,
  checkFileExists,
  setContentSecurityPolicy,
} = require("./utils");

//set the content security policy of the app
setContentSecurityPolicy();

$(function () {
  function cb(start, end) {
    $("#reportrange span").html(
      start.format("MMMM D, YYYY") + "  -  " + end.format("MMMM D, YYYY"),
    );
  }

  $("#reportrange").daterangepicker(
    {
      startDate: start,
      endDate: end,
      autoApply: true,
      timePicker: true,
      timePicker24Hour: true,
      timePickerIncrement: 10,
      timePickerSeconds: true,
      // minDate: '',
      ranges: {
        Today: [moment().startOf("day"), moment()],
        Yesterday: [
          moment().subtract(1, "days").startOf("day"),
          moment().subtract(1, "days").endOf("day"),
        ],
        "Last 7 Days": [
          moment().subtract(6, "days").startOf("day"),
          moment().endOf("day"),
        ],
        "Last 30 Days": [
          moment().subtract(29, "days").startOf("day"),
          moment().endOf("day"),
        ],
        "This Month": [moment().startOf("month"), moment().endOf("month")],
        "This Month": [moment().startOf("month"), moment()],
        "Last Month": [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
      },
    },
    cb,
  );

  cb(start, end);

  $("#expirationDate").daterangepicker({
    singleDatePicker: true,
    locale: {
      format: DATE_FORMAT,
    },
  });
});

//Allow only numbers in input field
$.fn.allowOnlyNumbers = function() {
  return this.on('keydown', function(e) {
  // Allow: backspace, delete, tab, escape, enter, ., ctrl/cmd+A, ctrl/cmd+C, ctrl/cmd+X, ctrl/cmd+V, end, home, left, right, down, up
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 || 
      (e.keyCode >= 35 && e.keyCode <= 40) || 
      ((e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88) && (e.ctrlKey === true || e.metaKey === true))) {
      return;
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
});
};
$('.number-input').allowOnlyNumbers();

//Serialize Object
$.fn.serializeObject = function () {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function () {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || "");
    } else {
      o[this.name] = this.value || "";
    }
  });
  return o;
};

auth = storage.get("auth");
user = storage.get("user");

$("#main_app").hide();
if (auth == undefined) {
  $.get(api + "users/check/", function (data) {});

  authenticate();
} else {
  $("#login").hide();
  $("#main_app").show();
  platform = storage.get("settings");

  if (platform != undefined) {
    if (platform.app == "Network Point of Sale Terminal") {
      api = "http://" + platform.ip + ":" + port + "/api/";
      perms = true;
    }
  }

  $.get(api + "users/user/" + user._id, function (data) {
    user = data;
    $("#loggedin-user").text(user.fullname);
  });

  $.get(api + "settings/get", function (data) {
    settings = data.settings;
  });

  $.get(api + "users/all", function (users) {
    allUsers = [...users];
  });

  $(document).ready(function () {
    //update title based on company
    let appTitle = !!settings ? `${validator.unescape(settings.store)} - ${appName}` : appName;
    $("title").text(appTitle);

    $(".loading").hide();

    loadCategories();
    loadProducts();
    loadCustomers();

    if (settings && settings.symbol) {
      $("#price_curr, #payment_curr, #change_curr").text(getCurrencySymbol());
    }

    setTimeout(function () {
      if (settings == undefined && auth != undefined) {
        $("#settingsModal").modal("show");
      } else {
        vat = parseFloat(getVATPercentage());
        $("#taxInfo").text(settings.charge_tax ? vat : 0);
      }
    }, 1500);

    $("#settingsModal").on("hide.bs.modal", function () {
      setTimeout(function () {
        if (settings == undefined && auth != undefined) {
          $("#settingsModal").modal("show");
        }
      }, 1000);
    });

    if (0 == user.perm_products) {
      $(".p_one").hide();
    }
    if (0 == user.perm_categories) {
      $(".p_two").hide();
    }
    if (0 == user.perm_transactions) {
      $(".p_three").hide();
    }
    if (0 == user.perm_users) {
      $(".p_four").hide();
    }
    if (0 == user.perm_settings) {
      $(".p_five").hide();
    }
    if (0 == user.perm_suppliers) {
      $(".p_six").hide();
    }

    function loadProducts() {
      $.get(api + "inventory/products", function (data) {
        data.forEach((item) => {
          item.price = parseFloat(item.price).toFixed(2);
        });

        allProducts = [...data];

        loadProductList();

        let delay = 0;
        let expiredCount = 0;
        allProducts.forEach((product) => {
          let todayDate = moment();
          let expiryDate = moment(product.expirationDate, DATE_FORMAT);

          if (!isExpired(expiryDate)) {
            const diffDays = daysToExpire(expiryDate);

            if (diffDays > 0 && diffDays <= 30) {
              var days_noun = diffDays > 1 ? "days" : "day";
              notiflix.Notify.warning(
                `${product.name} has only ${diffDays} ${days_noun} left to expiry`,
              );
            }
          } else {
            expiredCount++;
          }
        });

        //Show notification if there are any expired goods.
        if(expiredCount>0)
        {
           notiflix.Notify.failure(
          `${expiredCount} ${
            expiredCount > 0 ? "products" : "product"
          } expired. Please restock!`,
        );
        }

       
        $("#parent").text("");

        data.forEach((item) => {
          if (!categories.includes(item.category)) {
            categories.push(item.category);
          }
          let item_isExpired = isExpired(item.expirationDate);
          let item_stockStatus = getStockStatus(item.quantity,item.minStock);
          if(item.img==="")
          {
            item_img = default_item_img;
          }
          else
          {
            item_img = path.join(img_path, item.img);
            item_img = checkFileExists(item_img) ? item_img : default_item_img;
          }
          

          let item_info = `<div class="col-lg-2 box ${item.category}"
                                onclick="$(this).addToCart(${item._id}, ${
                                  item.quantity
                                }, ${item.stock})">
                            <div class="widget-panel widget-style-2 " title="${item.name}">                    
                            <div id="image"><img src="${item_img}" id="product_img" alt=""></div>                    
                                        <div class="text-muted m-t-5 text-center">
                                        <div class="name" id="product_name"><span class="${
                                          item_isExpired ? "text-danger" : ""
                                        }">${item.name}</span></div> 
                                        <span class="sku">${
                                          item.barcode || item._id
                                        }</span>
                                        <span class="${item_stockStatus<1?'text-danger':''}"><span class="stock">STOCK </span><span class="count">${
                                          item.stock == 1
                                            ? (item.quantity + (item.unit? (' ' + item.unit): ''))
                                            : "N/A"
                                        }</span></span></div>
                                        <span class="text-success text-center"><b data-plugin="counterup">${
                                          getCurrencySymbol() +
                                          moneyFormat(item.price)
                                        }</b> </span>
                            </div>
                        </div>`;
          $("#parent").append(item_info);
        });
      });
    }

    function loadCategories() {
      $.get(api + "categories/all", function (data) {
        allCategories = data;
        loadCategoryList();
        $("#category,#categories").html(`<option value="0">Select</option>`);
        allCategories.forEach((category) => {
          $("#category,#categories").append(
            `<option value="${category._id}">${category.name}</option>`,
          );
        });
      });
    }

    function loadCustomers() {
      $.get(api + "customers/all", function (customers) {
        $("#customer").html(
          `<option value="0" selected="selected">Walk in customer</option>`,
        );

        customers.forEach((cust) => {
          let customer = `<option value='{"id": ${cust._id}, "name": "${cust.name}"}'>${cust.name}</option>`;
          $("#customer").append(customer);
        });
      });
    }

    $.fn.addToCart = function (id, count, stock) {
      $.get(api + "inventory/product/" + id, function (product) {
        if (isExpired(product.expirationDate)) {
          notiflix.Report.failure(
            "Expired",
            `${product.name} is expired! Please restock.`,
            "Ok",
          );
        } else {
          if (count > 0) {
            $(this).addProductToCart(product);
          } else {
            if (stock == 1) {
              notiflix.Report.failure(
                "Out of stock!",
                `${product.name} is out of stock! Please restock.`,
                "Ok",
              );
            }
          }
        }
      });
    };

    function barcodeSearch(e) {
      e.preventDefault();
      let searchBarCodeIcon = $(".search-barcode-btn").html();
      $(".search-barcode-btn").empty();
      $(".search-barcode-btn").append(
        $("<i>", { class: "fa fa-spinner fa-spin" }),
      );

      let req = {
        skuCode: $("#skuCode").val(),
      };

      $.ajax({
        url: api + "inventory/product/sku",
        type: "POST",
        data: JSON.stringify(req),
        contentType: "application/json; charset=utf-8",
        cache: false,
        processData: false,
        success: function (product) {
          $(".search-barcode-btn").html(searchBarCodeIcon);
          const expired = isExpired(product.expirationDate);
          if (product._id != undefined && parseFloat(product.quantity) >= 0.01 && !expired) {
            $(this).addProductToCart(product);
            $("#searchBarCode").get(0).reset();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-ok" }),
            );
          } else if (expired) {
            notiflix.Report.failure(
              "Expired!",
              `${product.name} is expired`,
              "Ok",
            );
          } else if (parseFloat(product.quantity) < 0.01) {
            notiflix.Report.info(
              "Out of stock!",
              "This item is currently unavailable",
              "Ok",
            );
          } else {
            notiflix.Report.warning(
              "Not Found!",
              "<b>" + $("#skuCode").val() + "</b> is not a valid barcode!",
              "Ok",
            );

            $("#searchBarCode").get(0).reset();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-ok" }),
            );
          }
        },
        error: function (err) {
          if (err.status === 422) {
            $(this).showValidationError(data);
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-remove" }),
            );
          } else if (err.status === 404) {
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-remove" }),
            );
          } else {
            $(this).showServerError();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-warning-sign" }),
            );
          }
        },
      });
    }

    $("#searchBarCode").on("submit", function (e) {
      barcodeSearch(e);
    });

    $("body").on("click", "#jq-keyboard button", function (e) {
      let pressed = $(this)[0].className.split(" ");
      if ($("#skuCode").val() != "" && pressed[2] == "enter") {
        barcodeSearch(e);
      }
    });

    $.fn.addProductToCart = function (data) {
      // Check if product is uncountable (not pcs)
      if (data.unit && data.unit !== 'pcs') {
        // Show quantity popup for uncountable products
        currentProductForPopup = data;
        $("#popupQuantity").val('');
        renderPopupUnitButtons(data.unit);
        $("#popupUnit").text(data.unit);
        $("#popupAvailable").text(data.quantity);
        $("#popupAvailableUnit").text(data.unit);
        $("#quantityPopupModal").modal('show');
        return;
      }

      // For countable products (pcs), add directly
      item = {
        id: data._id,
        product_name: data.name,
        sku: data.sku,
        price: data.price,
        quantity: 1,
        unit: data.unit || 'pcs',
      };

      if ($(this).isExist(item)) {
        $(this).qtIncrement(index);
      } else {
        cart.push(item);
        $(this).renderTable(cart);
      }
    };

    $.fn.isExist = function (data) {
      let toReturn = false;
      $.each(cart, function (index, value) {
        if (value.id == data.id) {
          $(this).setIndex(index);
          toReturn = true;
        }
      });
      return toReturn;
    };

    $.fn.setIndex = function (value) {
      index = value;
    };

    $.fn.calculateCart = function () {
      let total = 0;
      let grossTotal;
      let total_items = 0;
      $.each(cart, function (index, data) {
        total += parseFloat(data.quantity) * data.price;
        total_items += parseFloat(data.quantity);
      });
      $("#total").text(total_items);
      total = total - $("#inputDiscount").val();
      $("#price").text(getCurrencySymbol() + moneyFormat(total.toFixed(2)));

      subTotal = total;

      if ($("#inputDiscount").val() >= total) {
        $("#inputDiscount").val(0);
      }

      if (settings.charge_tax) {
        totalVat = (total * vat) / 100;
        grossTotal = total + totalVat;
      } else {
        grossTotal = total;
      }

      orderTotal = grossTotal.toFixed(2);

      $("#gross_price").text(getCurrencySymbol() + moneyFormat(orderTotal));
      $("#payablePrice").val(moneyFormat(grossTotal));
    };

    $.fn.renderTable = function (cartList) {
      $("#cartTable .card-body").empty();
      $(this).calculateCart();
      $.each(cartList, function (index, data) {
        $("#cartTable .card-body").append(
          $("<div>", { class: "row m-t-10" }).append(
            $("<div>", { class: "col-md-1", text: index + 1 }),
            $("<div>", { class: "col-md-3", text: data.product_name }),
            $("<div>", { class: "col-md-3" }).append(
              $("<div>", { class: "input-group" }).append(
                $("<span>", { class: "input-group-btn" }).append(
                  $("<button>", {
                    class: "btn btn-light",
                    onclick: "$(this).qtDecrement(" + index + ")",
                  }).append($("<i>", { class: "fa fa-minus" })),
                ),
                $("<input>", {
                  class: "form-control",
                  type: "text",
                  readonly: "",
                  value: data.quantity + (data.unit ? (' ' + data.unit) : ''),
                  min: "1",
                  onInput: "$(this).qtInput(" + index + ")",
                }),
                $("<span>", { class: "input-group-btn" }).append(
                  $("<button>", {
                    class: "btn btn-light",
                    onclick: "$(this).qtIncrement(" + index + ")",
                  }).append($("<i>", { class: "fa fa-plus" })),
                ),
              ),
            ),
            $("<div>", {
              class: "col-md-3",
              text:
                getCurrencySymbol() +
                moneyFormat((data.price * data.quantity).toFixed(2)),
            }),
            $("<div>", { class: "col-md-1" }).append(
              $("<button>", {
                class: "btn btn-light btn-xs",
                onclick: "$(this).deleteFromCart(" + index + ")",
              }).append($("<i>", { class: "fa fa-times" })),
            ),
          ),
        );
      });
    };

    $.fn.deleteFromCart = function (index) {
      cart.splice(index, 1);
      $(this).renderTable(cart);
    };

    $.fn.qtIncrement = function (i) {
      item = cart[i];
      let product = allProducts.filter(function (selected) {
        return selected._id == parseInt(item.id);
      });

      if (product.length > 0 && product[0].stock == 1) {
        if (parseFloat(item.quantity) < parseFloat(product[0].quantity)) {
          item.quantity = (parseFloat(item.quantity) + 1).toFixed(item.unit && item.unit !== 'pcs' ? 2 : 0);
          $(this).renderTable(cart);
        } else {
          notiflix.Report.info(
            "No more stock!",
            "You have already added all the available stock.",
            "Ok",
          );
        }
      } else {
        item.quantity = (parseFloat(item.quantity) + 1).toFixed(item.unit && item.unit !== 'pcs' ? 2 : 0);
        $(this).renderTable(cart);
      }
    };

    $.fn.qtDecrement = function (i) {
      if (parseFloat(item.quantity) > 0.01) {
        item = cart[i];
        let q = parseFloat(item.quantity) - 1;
        if (q < 0.01) q = (item.unit && item.unit !== 'pcs') ? 0.01 : 1;
        item.quantity = q.toFixed(item.unit && item.unit !== 'pcs' ? 2 : 0);
        $(this).renderTable(cart);
      }
    };

    $.fn.qtInput = function (i) {
      item = cart[i];
      item.quantity = $(this).val();
      $(this).renderTable(cart);
    };

    $.fn.cancelOrder = function () {
      if (cart.length > 0) {
        const diagOptions = {
          title: "Are you sure?",
          text: "You are about to remove all items from the cart.",
          icon: "warning",
          showCancelButton: true,
          okButtonText: "Yes, clear it!",
          cancelButtonText: "Cancel",
          options: {
            // okButtonBackground: "#3085d6",
            cancelButtonBackground: "#d33",
          },
        };

        notiflix.Confirm.show(
          diagOptions.title,
          diagOptions.text,
          diagOptions.okButtonText,
          diagOptions.cancelButtonText,
          () => {
            cart = [];
            $(this).renderTable(cart);
            holdOrder = 0;
            notiflix.Report.success(
              "Cleared!",
              "All items have been removed.",
              "Ok",
            );
          },
          "",
          diagOptions.options,
        );
      }
    };

    $("#previewBillButton").on("click", function () {
      if (cart.length != 0) {
        const transactionData = {
          items: cart.map(item => ({
            name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            market_price: item.market_price || item.price,
            unit: item.unit || 'pcs'
          })),
          total: cart.reduce((sum, item) => sum + (item.quantity * item.price), 0),
          payment_type: 'Cash',
          paid: '',
          change: '',
          date: new Date().toISOString(),
          orderNumber: 'N/A',
          refNumber: 'N/A',
          customer: 'Walk in customer',
          cashier: 'Administrator',
          discount: 0
        };
        currentBillData = transactionData;
        const billContent = generateSinhalaBillContent(transactionData);
        $("#billPreviewContent").text(billContent);
        
        // Show logo in preview if available
        if (settings && settings.img) {
          const logo = path.join(img_path, validator.unescape(settings.img));
          if (checkFileExists(logo)) {
            $("#billPreviewLogo").html(`<img style='max-width: 50px;' src='${logo}' />`);
          } else {
            $("#billPreviewLogo").html('');
          }
        } else {
          $("#billPreviewLogo").html('');
        }
        
        $("#sinhalaBillPreviewModal").modal('show');
      } else {
        notiflix.Report.warning("Oops!", "There is nothing to preview!", "Ok");
      }
    });

    $("#payButton").on("click", function () {
      if (cart.length != 0) {
        $("#paymentModel").modal("toggle");
      } else {
        notiflix.Report.warning("Oops!", "There is nothing to pay!", "Ok");
      }
    });

    $("#hold").on("click", function () {
      if (cart.length != 0) {
        $("#dueModal").modal("toggle");
      } else {
        notiflix.Report.warning("Oops!", "There is nothing to hold!", "Ok");
      }
    });

    function printJobComplete() {
      notiflix.Report.success("Done", "print job complete", "Ok");
    }

    $.fn.submitDueOrder = function (status) {
      let items = "";
      let payment = 0;
      paymentType = $('.list-group-item.active').data('payment-type');
      cart.forEach((item, index) => {
        const qty = parseFloat(item.quantity || 0);
        const our = parseFloat(item.price || 0);
        const market = parseFloat(item.market_price || item.price || 0);
        const subtotalLine = qty * our;
        items += `<tr>
              <td colspan="4"><strong>${DOMPurify.sanitize((index + 1).toString())}. ${DOMPurify.sanitize(item.product_name)}</strong></td>
        </tr>`;
        items += `<tr>
          <td style="text-align:center;">${DOMPurify.sanitize(qty.toString())}</td>
          <td style="text-align:center;">${DOMPurify.sanitize(market.toFixed(2))}</td>
          <td style="text-align:center;">${DOMPurify.sanitize(our.toFixed(2))}</td>
          <td style="text-align:center;">${DOMPurify.sanitize(subtotalLine.toFixed(2))}</td>
        </tr>`;
      });

      let currentTime = new Date(moment());
      let discount = $("#inputDiscount").val();
      let customer = JSON.parse($("#customer").val());
      let date = moment(currentTime).format("YYYY-MM-DD HH:mm:ss");
      let paymentAmount = $("#payment").val().replace(",", "");
      let changeAmount = $("#change").text().replace(",", "");
      let paid =
        $("#payment").val() == "" ? "" : parseFloat(paymentAmount).toFixed(2);
      let change =
        $("#change").text() == "" ? "" : parseFloat(changeAmount).toFixed(2);
      let refNumber = $("#refNumber").val();
      let orderNumber = holdOrder;
      let type = "";
      let tax_row = "";
      switch (paymentType) {
        case 1:
          type = "Cash";
          break;
        case 3:
          type = "Card";
          break;
      }

      if (paid != "") {
        payment = `<tr>
                        <td>Paid</td>
                        <td>:</td>
                        <td> </td>
                        <td class="text-right">${getCurrencySymbol()} ${moneyFormat(
                          Math.abs(paid).toFixed(2),
                        )}</td>
                    </tr>
                    <tr>
                        <td>Change</td>
                        <td>:</td>
                        <td> </td>
                        <td class="text-right">${getCurrencySymbol()} ${moneyFormat(
                          Math.abs(change).toFixed(2),
                        )}</td>
                    </tr>
                    <tr>
                        <td>Method</td>
                        <td>:</td>
                        <td> </td>
                        <td class="text-right">${type}</td>
                    </tr>`;
      }

      if (settings.charge_tax) {
        tax_row = `<tr>
                    <td>VAT(${getVATPercentage()})% </td>
                    <td>:</td>
                    <td class="text-right">${getCurrencySymbol()} ${moneyFormat(
                      parseFloat(totalVat).toFixed(2),
                    )}</td>
                </tr>`;
      }

      if (status == 0) {
        if ($("#customer").val() == 0 && $("#refNumber").val() == "") {
          notiflix.Report.warning(
            "Reference Required!",
            "You either need to select a customer <br> or enter a reference!",
            "Ok",
          );
          return;
        }
      }

      $(".loading").show();

      if (holdOrder != 0) {
        orderNumber = holdOrder;
        method = "PUT";
      } else {
        orderNumber = Math.floor(Date.now() / 1000);
        method = "POST";
      }

      logo = path.join(img_path, validator.unescape(settings.img));

      receipt = `<div style="font-size: 12px">                            
        <p style="text-align: center;">
        ${
          checkFileExists(logo)
            ? `<img style='max-width: 120px' src='${logo}' /><br>`
            : ``
        }
            <span style="font-size: 22px;">${validator.unescape(settings.store)}</span> <br>
            ${validator.unescape(settings.address_one)} <br>
            ${validator.unescape(settings.address_two)} <br>
            ${
              validator.unescape(settings.contact) != "" ? "Tel: " + validator.unescape(settings.contact) + "<br>" : ""
            } 
            ${validator.unescape(settings.tax) != "" ? "Vat No: " + validator.unescape(settings.tax) + "<br>" : ""} 
        </p>
        <hr>
        <left>
            <p>
            ඇණවුම් අංකය : ${orderNumber} <br>
            යොමු අංකය : ${refNumber == "" ? orderNumber : _.escape(refNumber)} <br>
            ගැණුම්කරු : ${
              customer == 0 || !customer ? "Walk in customer" : _.escape(customer.name)
            } <br>
            කැෂියර් : ${user.fullname} <br>
            දිනය: ${date}<br>
            </p>

        </left>
        <hr>
        <table width="100%">
                    <colgroup>
                <col style="width: 30%;">
                <col style="width: 30%;">
                <col style="width: 30%;">
                <col style="width: 30%;">
              </colgroup>
            <thead>
            <tr>
                <th>ප්‍රමාණය</th>
                <th>සා/මිල</th>
                <th>අපේ මිල</th>
                <th class="text-right">වටිනාකම</th>
            </tr>
            </thead>
            <tbody>
             ${items}
            <tr><td colspan="4"><hr></td></tr>
            <tr>                        
                <td><b>මුළු වටිනාකම</b></td>
                <td>:</td>
                <td> </td>
                <td class="text-right"><b>${getCurrencySymbol()}${moneyFormat(
                  subTotal.toFixed(2),
                )}</b></td>
            </tr>
            <tr>
                <td>Discount</td>
                <td>:</td>
                <td class="text-right">${
                  discount > 0
                    ? getCurrencySymbol() +
                      moneyFormat(parseFloat(discount).toFixed(2))
                    : ""
                }</td>
            </tr>
            ${tax_row}
            <tr>
                <td><h5>Total</h5></td>
                <td><h5>:</h5></td>
                <td> </td>
                <td class="text-right">
                    <h5>${getCurrencySymbol()} ${moneyFormat(
                      parseFloat(orderTotal).toFixed(2),
                    )}</h5>
                </td>
            </tr>
            ${payment == 0 ? "" : payment}
            </tbody>
            </table>
            <br>
            <hr>
            <br>
            <p style="text-align: center;">
             ${validator.unescape(settings.footer)}
             </p>
            </div>`;

      if (status == 3) {
        if (cart.length > 0) {
          printJS({ printable: receipt, type: "raw-html" });

          $(".loading").hide();
          return;
        } else {
          $(".loading").hide();
          return;
        }
      }

      let data = {
        order: orderNumber,
        ref_number: refNumber,
        discount: discount,
        customer: customer,
        status: status,
        subtotal: parseFloat(subTotal).toFixed(2),
        tax: totalVat,
        order_type: 1,
        items: cart,
        date: currentTime,
        payment_type: type,
        payment_info: $("#paymentInfo").val(),
        total: orderTotal,
        paid: paid,
        change: change,
        _id: orderNumber,
        till: platform.till,
        mac: platform.mac,
        user: user.fullname,
        user_id: user._id,
      };

      $.ajax({
        url: api + "new",
        type: method,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        cache: false,
        processData: false,
        success: function (data) {
          // Print Sinhala bill for 80mm thermal printer before clearing cart
          const transactionData = {
            items: cart.map(item => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.price,
              market_price: item.market_price || item.price,
              unit: item.unit || 'pcs'
            })),
            total: orderTotal,
            payment_type: type,
            paid: paid,
            change: change,
            date: date,
            orderNumber: orderNumber,
            refNumber: refNumber,
            customer: customer == 0 || !customer ? "Walk in customer" : customer.name,
            cashier: user.fullname,
            discount: parseFloat(discount) || 0
          };
          printSinhalaBill(transactionData);
          
          cart = [];
          receipt = DOMPurify.sanitize(receipt,{ ALLOW_UNKNOWN_PROTOCOLS: true });
          $("#viewTransaction").html("");
          $("#viewTransaction").html(receipt);
          $("#orderModal").modal("show");
          loadProducts();
          loadCustomers();
          $(".loading").hide();
          $("#dueModal").modal("hide");
          $("#paymentModel").modal("hide");
          $(this).getHoldOrders();
          $(this).renderTable(cart);
        },

        error: function (data) {
          $(".loading").hide();
          $("#dueModal").modal("toggle");
          notiflix.Report.failure(
            "Something went wrong!",
            "Please refresh this page and try again",
            "Ok",
          );
        },
      });

      $("#refNumber").val("");
      $("#change").text("");
      $("#payment,#paymentText").val("");
    };

    $.get(api + "on-hold", function (data) {
      holdOrderList = data;
      holdOrderlocation.empty();
      $(this).renderHoldOrders(holdOrderList, holdOrderlocation, 1);
    });

    $.fn.getHoldOrders = function () {
      $.get(api + "on-hold", function (data) {
        holdOrderList = data;
        clearInterval(dotInterval);
        holdOrderlocation.empty();
        $(this).renderHoldOrders(holdOrderList, holdOrderlocation, 1);
      });
    };

    $.fn.renderHoldOrders = function (data, renderLocation, orderType) {
      $.each(data, function (index, order) {
        $(this).calculatePrice(order);
        renderLocation.append(
          $("<div>", {
            class:
              orderType == 1 ? "col-md-3 order" : "col-md-3 customer-order",
          }).append(
            $("<a>").append(
              $("<div>", { class: "card-box order-box" }).append(
                $("<p>").append(
                  $("<b>", { text: "Ref :" }),
                  $("<span>", { text: order.ref_number, class: "ref_number" }),
                  $("<br>"),
                  $("<b>", { text: "Price :" }),
                  $("<span>", {
                    text: order.total,
                    class: "label label-info",
                    style: "font-size:14px;",
                  }),
                  $("<br>"),
                  $("<b>", { text: "Items :" }),
                  $("<span>", { text: order.items.length }),
                  $("<br>"),
                  $("<b>", { text: "Customer :" }),
                  $("<span>", {
                    text:
                      order.customer != 0 && order.customer
                        ? order.customer.name
                        : "Walk in customer",
                    class: "customer_name",
                  }),
                ),
                $("<button>", {
                  class: "btn btn-danger del",
                  onclick:
                    "$(this).deleteOrder(" + index + "," + orderType + ")",
                }).append($("<i>", { class: "fa fa-trash" })),

                $("<button>", {
                  class: "btn btn-default",
                  onclick:
                    "$(this).orderDetails(" + index + "," + orderType + ")",
                }).append($("<span>", { class: "fa fa-shopping-basket" })),
              ),
            ),
          ),
        );
      });
    };

    $.fn.calculatePrice = function (data) {
      totalPrice = 0;
      $.each(data.products, function (index, product) {
        totalPrice += product.price * product.quantity;
      });

      let vat = (totalPrice * data.vat) / 100;
      totalPrice = (totalPrice + vat - data.discount).toFixed(0);

      return totalPrice;
    };

    $.fn.orderDetails = function (index, orderType) {
      $("#refNumber").val("");

      if (orderType == 1) {
        $("#refNumber").val(holdOrderList[index].ref_number);

        $("#customer option:selected").removeAttr("selected");

        $("#customer option")
          .filter(function () {
            return $(this).text() == "Walk in customer";
          })
          .prop("selected", true);

        holdOrder = holdOrderList[index]._id;
        cart = [];
        $.each(holdOrderList[index].items, function (index, product) {
          item = {
            id: product.id,
            product_name: product.product_name,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
          };
          cart.push(item);
        });
      } else if (orderType == 2) {
        $("#refNumber").val("");

        $("#customer option:selected").removeAttr("selected");

        $("#customer option")
          .filter(function () {
            return customerOrderList[index].customer && $(this).text() == customerOrderList[index].customer.name;
          })
          .prop("selected", true);

        holdOrder = customerOrderList[index]._id;
        cart = [];
        $.each(customerOrderList[index].items, function (index, product) {
          item = {
            id: product.id,
            product_name: product.product_name,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
          };
          cart.push(item);
        });
      }
      $(this).renderTable(cart);
      $("#holdOrdersModal").modal("hide");
      $("#customerModal").modal("hide");
    };

    $.fn.deleteOrder = function (index, type) {
      switch (type) {
        case 1:
          deleteId = holdOrderList[index]._id;
          break;
        case 2:
          deleteId = customerOrderList[index]._id;
      }

      let data = {
        orderId: deleteId,
      };
      let diagOptions = {
        title: "Delete order?",
        text: "This will delete the order. Are you sure you want to delete!",
        icon: "warning",
        showCancelButton: true,
        okButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        okButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "delete",
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            cache: false,
            success: function (data) {
              $(this).getHoldOrders();
              $(this).getCustomerOrders();

              notiflix.Report.success(
                "Deleted!",
                "You have deleted the order!",
                "Ok",
              );
            },
            error: function (data) {
              $(".loading").hide();
            },
          });
        },
      );
    };

    // Orders feature removed

    $("#saveCustomer").on("submit", function (e) {
      e.preventDefault();

      let custData = {
        _id: Math.floor(Date.now() / 1000),
        name: $("#userName").val(),
        phone: $("#phoneNumber").val(),
        email: $("#emailAddress").val(),
        address: $("#userAddress").val(),
      };

      $.ajax({
        url: api + "customers/customer",
        type: "POST",
        data: JSON.stringify(custData),
        contentType: "application/json; charset=utf-8",
        cache: false,
        processData: false,
        success: function (data) {
          $("#newCustomer").modal("hide");
          notiflix.Report.success(
            "Customer added!",
            "Customer added successfully!",
            "Ok",
          );
          $("#customer option:selected").removeAttr("selected");
          $("#customer").append(
            $("<option>", {
              text: custData.name,
              value: `{"id": ${custData._id}, "name": ${custData.name}}`,
              selected: "selected",
            }),
          );

          $("#customer")
            .val(`{"id": ${custData._id}, "name": ${custData.name}}`)
            .trigger("chosen:updated");
        },
        error: function (data) {
          $("#newCustomer").modal("hide");
          notiflix.Report.failure(
            "Error",
            "Something went wrong please try again",
            "Ok",
          );
        },
      });
    });

    $("#confirmPayment").hide();

    $("#cardInfo").hide();

    $("#payment").on("input", function () {
      $(this).calculateChange();
    });
    $("#confirmPayment").on("click", function () {
      if ($("#payment").val() == "") {
        notiflix.Report.warning(
          "Nope!",
          "Please enter the amount that was paid!",
          "Ok",
        );
      } else {
        $(this).submitDueOrder(1);
      }
    });

    $("#transactions").on("click", function () {
      loadTransactions();
      loadUserList();

      $("#pos_view").hide();
      $("#pointofsale").show();
      $("#transactions_view").show();
      $(this).hide();
    });

    $("#pointofsale").on("click", function () {
      $("#pos_view").show();
      $("#transactions").show();
      $("#transactions_view").hide();
      $(this).hide();
    });

    $("#viewRefOrders").on("click", function () {
      setTimeout(function () {
        $("#holdOrderInput").focus();
      }, 500);
    });

    $("#newProductModal").on("click", function () {
      $("#saveProduct").get(0).reset();
      $("#current_img").text("");
      $("#product_benefit").val("");
      updateUnitNotes();
    });

    $(document).on('change', '#unit', function(){
      updateUnitNotes();
    });

    function updateUnitNotes(){
      const u = $("#unit").val() || 'pcs';
      const note = u === 'pcs' ? 'per pcs' : ('per ' + u);
      $("#unit_note_market").text(note);
      $("#unit_note_our").text(note);
      $("#unit_note_price").text(note);
    }

    // Render unit buttons in popup based on base unit
    function renderPopupUnitButtons(baseUnit){
      const container = $("#popupUnitButtons");
      container.empty();
      let units = [];
      if (baseUnit === 'kg' || baseUnit === 'g') {
        units = ['g','kg'];
      } else if (baseUnit === 'L' || baseUnit === 'ml') {
        units = ['ml','L'];
      } else {
        units = [baseUnit];
      }
      units.forEach(function(u, idx){
        const btn = $('<button>', {
          type: 'button',
          class: 'btn unit-btn ' + (idx === 0 ? 'btn-primary active' : 'btn-default'),
          'data-unit': u,
          text: u
        });
        container.append(btn);
      });
    }

    // Helper function for translations with fallback
    function getTranslation(key, fallback) {
      if (typeof window.i18next !== 'undefined' && window.i18next.t) {
        return window.i18next.t(key);
      }
      return fallback || key;
    }

    // Store current product for quantity popup
    let currentProductForPopup = null;

    // Handle quantity popup for uncountable products
    $(document).on('click', '#confirmQuantity', function(){
      const quantity = parseFloat($("#popupQuantity").val());
      const selectedUnitBtn = $("#popupUnitButtons .unit-btn.active");
      const selectedUnit = selectedUnitBtn.length ? selectedUnitBtn.data('unit') : (currentProductForPopup ? currentProductForPopup.unit : 'pcs');
      
      if (!quantity || quantity <= 0) {
        Notiflix.Notify.Warning(getTranslation('quantityPopup.invalidQuantity', 'Please enter a valid quantity'));
        return;
      }

      if (currentProductForPopup) {
        // Convert quantity to product's base unit if needed
        let finalQuantity = quantity;
        let finalUnit = selectedUnit;
        
        // Convert to product's unit if different
        if (selectedUnit !== currentProductForPopup.unit) {
          if (selectedUnit === 'g' && currentProductForPopup.unit === 'kg') {
            finalQuantity = quantity / 1000;
            finalUnit = 'kg';
          } else if (selectedUnit === 'kg' && currentProductForPopup.unit === 'g') {
            finalQuantity = quantity * 1000;
            finalUnit = 'g';
          } else if (selectedUnit === 'ml' && currentProductForPopup.unit === 'L') {
            finalQuantity = quantity / 1000;
            finalUnit = 'L';
          } else if (selectedUnit === 'L' && currentProductForPopup.unit === 'ml') {
            finalQuantity = quantity * 1000;
            finalUnit = 'ml';
          }
        }

        // Check stock availability
        if (finalQuantity > parseFloat(currentProductForPopup.quantity)) {
          const message = getTranslation('quantityPopup.insufficientStock', 'Insufficient stock. Available: {{available}} {{unit}}')
            .replace('{{available}}', currentProductForPopup.quantity)
            .replace('{{unit}}', currentProductForPopup.unit);
          Notiflix.Notify.Warning(message);
          return;
        }

        // Add to cart with converted quantity
        const cartItem = {
          id: currentProductForPopup._id,
          product_name: currentProductForPopup.name,
          sku: currentProductForPopup.sku,
          price: parseFloat(currentProductForPopup.price),
          quantity: finalQuantity,
          unit: finalUnit,
          barcode: currentProductForPopup.barcode
        };

        cart.push(cartItem);
        $("#quantityPopupModal").modal('hide');
        $("#cartTable").renderTable(cart);
        $("#cartTable").calculateCart();
        
        Notiflix.Notify.Success(getTranslation('quantityPopup.addedToCart', 'Added {{quantity}} {{unit}} to cart')
          .replace('{{quantity}}', quantity)
          .replace('{{unit}}', selectedUnit));
      }
    });

    // Unit button selection
    $(document).on('click', '#popupUnitButtons .unit-btn', function(){
      $('#popupUnitButtons .unit-btn').removeClass('active btn-primary').addClass('btn-default');
      $(this).addClass('active btn-primary').removeClass('btn-default');
      $("#popupUnit").text($(this).data('unit'));
      // Don't change the available unit - keep it as product's original unit
    });

    // Sinhala Bill Printing for 80mm Thermal Printer
    function printSinhalaBill(transactionData) {
      const billContent = generateSinhalaBillContent(transactionData);
      printBill(billContent);
    }

    function generateSinhalaBillContent(data) {
      const now = new Date();
      const date = now.toLocaleDateString('en-GB');
      const time = now.toLocaleTimeString('en-GB', { hour12: false });
      
      let bill = '';
      
      // Header - centered store title with settings
      bill += '='.repeat(32) + '\n';
      if (settings && settings.store) {
        const storeName = validator.unescape(settings.store);
        const padding = Math.max(0, Math.floor((32 - storeName.length) / 2));
        bill += ' '.repeat(padding) + storeName + '\n';
      } else {
        bill += '        Store Name\n';
      }
      bill += '='.repeat(32) + '\n';
      
      // Address info - centered
      if (settings && settings.address_one) {
        const addr1 = validator.unescape(settings.address_one);
        const p1 = Math.max(0, Math.floor((32 - addr1.length) / 2));
        bill += ' '.repeat(p1) + addr1 + '\n';
      }
      if (settings && settings.address_two) {
        const addr2 = validator.unescape(settings.address_two);
        const p2 = Math.max(0, Math.floor((32 - addr2.length) / 2));
        bill += ' '.repeat(p2) + addr2 + '\n';
      }
      if (settings && settings.contact) {
        const contact = `Tel: ${validator.unescape(settings.contact)}`;
        const p3 = Math.max(0, Math.floor((32 - contact.length) / 2));
        bill += ' '.repeat(p3) + contact + '\n';
      }
      if (settings && settings.tax) {
        const tax = `Vat No: ${validator.unescape(settings.tax)}`;
        const p4 = Math.max(0, Math.floor((32 - tax.length) / 2));
        bill += ' '.repeat(p4) + tax + '\n';
      }
      
      // Date/time and payment line - centered
      const dateTime = `දිනය: ${date}    කාලය: ${time}`;
      const p5 = Math.max(0, Math.floor((32 - dateTime.length) / 2));
      bill += ' '.repeat(p5) + dateTime + '\n';
      const payment = 'පාරිභෝ- CASH';
      const p6 = Math.max(0, Math.floor((32 - payment.length) / 2));
      bill += ' '.repeat(p6) + payment + '\n';
      bill += '-'.repeat(32) + '\n';
      
      // Table header
      bill += 'ප්‍රමාණය  සා/මිල  අපේ මිල  වටිනාකම\n';
      bill += '-'.repeat(32) + '\n';
      
      // Items rows with fixed-width numeric columns
      let totalMarketPrice = 0;
      let totalOurPrice = 0;
      let totalBenefit = 0;
      
      data.items.forEach((item, index) => {
        const itemNumber = `${index + 1})`;
        const quantity = item.quantity;
        const marketPrice = parseFloat(item.market_price);
        const ourPrice = parseFloat(item.price);
        const subtotal = quantity * ourPrice;
        const benefit = quantity * (marketPrice - ourPrice);
        
        totalMarketPrice += quantity * marketPrice;
        totalOurPrice += subtotal;
        totalBenefit += benefit;
        
        bill += `${itemNumber} ${item.name}\n`;
        const qtyStr = quantity.toString();
        const marketStr = marketPrice.toFixed(2);
        const ourStr = ourPrice.toFixed(2);
        const subtotalStr = subtotal.toFixed(2);
        bill += `${qtyStr.padStart(8)} ${marketStr.padStart(8)} ${ourStr.padStart(8)} ${subtotalStr.padStart(10)}\n`;
      });
      
      bill += '-'.repeat(32) + '\n';
      
      // Totals - left aligned
      const totalMarketStr = `සම්පූර්ණ සාමාන්‍ය වෙළඳපොල මිල: ${totalMarketPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      const totalOurStr = `සම්පූර්ණ අපගේ මිල: ${totalOurPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      const totalBenefitStr = `සම්පූර්ණ පාරිභෝගික ප්‍රයෝජනය: ${totalBenefit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      bill += totalMarketStr + '\n';
      bill += totalOurStr + '\n';
      bill += totalBenefitStr + '\n';
      bill += '='.repeat(32) + '\n';
      
      // Footer (centered if available)
      if (settings && settings.footer) {
        const footer = validator.unescape(settings.footer);
        const p7 = Math.max(0, Math.floor((32 - footer.length) / 2));
        bill += ' '.repeat(p7) + footer + '\n';
      } else {
        bill += '        ස්තූතියි!\n';
      }
      bill += '='.repeat(32) + '\n';
      
      return bill;
    }

    function printBill(content) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      
      // Get logo path if available
      let logoHtml = '';
      if (settings && settings.img) {
        const logo = path.join(img_path, validator.unescape(settings.img));
        if (checkFileExists(logo)) {
          logoHtml = `<img style='max-width: 50px; display: block; margin: 0 auto;' src='${logo}' /><br>`;
        }
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill Print</title>
            <style>
              @media print {
                @page { 
                  size: 80mm auto; 
                  margin: 0;
                }
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 14px; 
                  font-weight: bold;
                  line-height: 1.3;
                  margin: 0;
                  padding: 8px;
                  width: 80mm;
                }
                .bill-content {
                  white-space: pre-line;
                  font-size: 13px;
                  font-weight: bold;
                }
                .logo {
                  text-align: center;
                  margin-bottom: 10px;
                }
              }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 14px; 
                font-weight: bold;
                line-height: 1.3;
                margin: 0;
                padding: 8px;
                width: 80mm;
              }
              .bill-content {
                white-space: pre-line;
                font-size: 13px;
                font-weight: bold;
              }
              .logo {
                text-align: center;
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <div class="logo">${logoHtml}</div>
            <div class="bill-content">${content}</div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    // Store current bill data for preview
    let currentBillData = null;

    // Manual Sinhala bill printing from order modal
    window.printSinhalaBillFromModal = function() {
      const transactionData = extractTransactionDataFromModal();
      if (transactionData) {
        printSinhalaBill(transactionData);
      }
    };

    // Preview Sinhala bill from order modal
    window.previewSinhalaBillFromModal = function() {
      const transactionData = extractTransactionDataFromModal();
      if (transactionData) {
        currentBillData = transactionData;
        const billContent = generateSinhalaBillContent(transactionData);
        $("#billPreviewContent").text(billContent);
        
        // Show logo in preview if available
        if (settings && settings.img) {
          const logo = path.join(img_path, validator.unescape(settings.img));
          if (checkFileExists(logo)) {
            $("#billPreviewLogo").html(`<img style='max-width: 50px;' src='${logo}' />`);
          } else {
            $("#billPreviewLogo").html('');
          }
        } else {
          $("#billPreviewLogo").html('');
        }
        
        $("#sinhalaBillPreviewModal").modal('show');
      }
    };

    // Print from preview
    window.printFromPreview = function() {
      if (currentBillData) {
        printSinhalaBill(currentBillData);
        $("#sinhalaBillPreviewModal").modal('hide');
      }
    };

    // Extract transaction data from modal
    function extractTransactionDataFromModal() {
      // Get the current transaction data from the modal
      const transactionHtml = $("#viewTransaction").html();
      
      // Extract items from the HTML table
      const items = [];
      $("#viewTransaction table tbody tr").each(function() {
        const cells = $(this).find('td');
        if (cells.length >= 3) {
          const name = $(cells[0]).text().trim();
          const quantity = parseFloat($(cells[1]).text().trim());
          const priceText = $(cells[2]).text().trim();
          const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
          
          if (name && !isNaN(quantity) && !isNaN(price)) {
            items.push({
              name: name,
              quantity: quantity,
              price: price,
              market_price: price, // Use same price as market price if not available
              unit: 'pcs'
            });
          }
        }
      });
      
      if (items.length > 0) {
        return {
          items: items,
          total: items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
          payment_type: 'Cash',
          paid: '',
          change: '',
          date: new Date().toISOString(),
          orderNumber: 'N/A',
          refNumber: 'N/A',
          customer: 'Walk in customer',
          cashier: 'Administrator',
          discount: 0
        };
      } else {
        Notiflix.Notify.Warning('No items found to print');
        return null;
      }
    }
    $("#suppliersBtn").on("click", function () {
      $("#suppliersModal").modal("show");
      loadSuppliers();
    });

    $("#newSupplierBtn").on("click", function () {
      $("#saveSupplier").get(0).reset();
    });

    $("#saveSupplier").submit(function (e) {
      e.preventDefault();
      let formData = $(this).serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
      }, {});

      $.ajax({
        url: api + "suppliers/supplier",
        method: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(formData),
        success: function (data) {
          $("#newSupplierModal").modal("hide");
          notiflix.Report.success(
            i18next.t('supplier.added_title', 'Supplier added!'),
            i18next.t('supplier.added_success', 'Supplier added successfully!'),
            "Ok",
          );
          loadSuppliers();
        },
        error: function () {
          $("#newSupplierModal").modal("hide");
          notiflix.Report.failure(
            i18next.t('common.error', 'Error'),
            i18next.t('supplier.added_error', 'Something went wrong please try again'),
            "Ok",
          );
        },
      });
    });

    // Delegate supplier action handlers to survive DataTable redraws
    $(document).off('click', '.supplier-settle').on('click', '.supplier-settle', function(){
      const idx = $(this).data('index');
      const s = (window._suppliers||[])[idx];
      if (!s) return;
      const id = s._id || s.supplier_id;
      $("#settle_supplier_id").val(id);
      $.get(api + 'suppliers/supplier/' + id, function(full){
        const due = parseFloat((full && full.amount_due) || s.amount_due || 0);
        const paid = parseFloat((full && full.amount_paid) || s.amount_paid || 0);
        const remaining = (due - paid);
        $("#settle_base_remaining").val(remaining.toFixed(2));
        $("#settle_remaining").text(`${getCurrencySymbol()}${moneyFormat(remaining.toFixed(2))}`);
        $("#settle_total_input").val('');
        $("#settle_total_date").val(((full && full.payment_date) || s.payment_date || '').substring(0,10));
        $("#settle_status").val('Partially Paid');
        const history = (full && full.history) || [];
        let h = "";
        history.forEach(function(ent){
          const amt = parseFloat(ent.amount||0);
          h += `\n<tr><td>${getCurrencySymbol()}${moneyFormat(amt.toFixed(2))}</td><td>${_.escape((ent.date||'').substring(0,10))}</td></tr>`;
        });
        $("#supplier_history_body").html(h);
        $("#settleSupplierModal").modal('show');
      });
    });

    $(document).off('click', '.supplier-view').on('click', '.supplier-view', function(){
      const idx = $(this).data('index');
      const s = (window._suppliers||[])[idx];
      if (!s) return;
      notiflix.Report.info(
        i18next.t('supplier.details', 'Supplier details'),
        `${_.escape(s.name)}<br>${_.escape(s.contact_info || '')}<br>${i18next.t('supplier.amount_due','Amount Due')}: ${getCurrencySymbol()}${moneyFormat((s.amount_due||0).toFixed(2))}<br>${i18next.t('supplier.amount_paid','Amount Paid')}: ${getCurrencySymbol()}${moneyFormat((s.amount_paid||0).toFixed(2))}`,
        'Ok'
      );
    });

    function renderSupplierList(list){
      let html = "";
      list.forEach(function (s, index) {
        const due = parseFloat(s.amount_due || 0);
        const paid = parseFloat(s.amount_paid || 0);
        const status = s.payment_status || (paid > 0 && paid < due ? 'Partially Paid' : (due > 0 && paid === 0 ? 'Need to Pay' : ''));
        const remaining = Math.max(0, (due - paid));
        const statusLabel = (status === 'Partially Paid' && remaining > 0)
          ? `${_.escape(status)} (${getCurrencySymbol()}${moneyFormat(remaining.toFixed(2))} ${i18next.t('supplier.remaining','remaining')})`
          : _.escape(status);
        html += `\n<tr>\n  <td>${_.escape(s.name || '')}</td>\n  <td>${statusLabel}</td>\n  <td>${_.escape(s.payment_date || '')}</td>\n  <td>${getCurrencySymbol()}${moneyFormat((due||0).toFixed(2))} / ${getCurrencySymbol()}${moneyFormat((paid||0).toFixed(2))}</td>\n  <td class="nobr"><span class="btn-group"><button data-index="${index}" class="btn btn-info btn-sm supplier-settle"><i class="fa fa-check"></i></button><button data-index="${index}" class="btn btn-warning btn-sm supplier-view"><i class="fa fa-eye"></i></button></span></td>\n</tr>`;
      });
      $("#supplier_list").html(html);
    }

    function loadSuppliers(){
      $.get(api + "suppliers/all", function (data) {
        window._suppliers = data || [];
        renderSupplierList(window._suppliers);
        triggerSupplierNotifications(window._suppliers);
        if ($.fn.DataTable.isDataTable('#supplierList')) {
          $("#supplierList").DataTable().destroy();
        }
        $("#supplierList").DataTable({
          order: [[0, "asc"]],
          autoWidth: false,
        });

        // Bind search box to DataTable search
        setTimeout(function(){
          const dt = $("#supplierList").DataTable();
          $("#supplierSearch").off('keyup change').on('keyup change', function(){
            dt.search(this.value).draw();
          });
        }, 0);
      });
    }

    function triggerSupplierNotifications(list){
      (list||[]).forEach(function(s){
        const due = parseFloat(s.amount_due || 0);
        const paid = parseFloat(s.amount_paid || 0);
        const date = s.payment_date || '';
        if (due > paid && paid > 0){
          notiflix.Notify.warning(i18next.t('supplier.payment_partially_paid', { name: s.name, amount: moneyFormat((due-paid).toFixed(2)), date: date }));
        } else if (due > 0 && paid === 0){
          notiflix.Notify.failure(i18next.t('supplier.payment_due', { name: s.name, amount: moneyFormat(due.toFixed(2)), date: date }));
        }
      });
    }

    // removed addSettleRow helper; using single input only

    $("#addSettleRow").on('click', function(){
      // removed table rows feature
    });

    $("#settleSupplierForm").on("submit", function(e){
      e.preventDefault();
      const id = $("#settle_supplier_id").val();
      let totalPay = parseFloat($("#settle_total_input").val()||0);
      if (isNaN(totalPay) || totalPay <= 0){
        notiflix.Report.warning(i18next.t('messages.warning','Warning'), i18next.t('supplier.amount_to_pay','Amount to pay') + ' ?', 'Ok');
        return;
      }
      const entryDate = $("#settle_total_date").val() || new Date().toISOString().substring(0,10);
      const entries = [{ amount: totalPay, date: entryDate, note: 'settlement' }];
      const status = $("#settle_status").val();
      const current = (window._suppliers||[]).find(s => (s._id||s.supplier_id)==id) || {};
      const newPaid = parseFloat(current.amount_paid||0) + totalPay;
      const due = parseFloat(current.amount_due||0);
      if (newPaid > due){
        notiflix.Report.warning(i18next.t('messages.warning','Warning'), i18next.t('supplier.overpay','You are paying more than due amount'), 'Ok');
        return;
      }
      const finalStatus = status === 'Paid' || newPaid >= due ? 'Paid' : 'Partially Paid';

      const body = {
        supplier_id: isNaN(Number(id)) ? id : Number(id),
        amount_paid: newPaid,
        payment_status: finalStatus,
        payment_date: current.payment_date || '',
      };

      $.ajax({
        url: api + 'suppliers/supplier',
        method: 'PUT',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(body),
        success: function(){
          // append all entries, then refresh modal + list
          function postHistorySequential(index){
            if (index >= entries.length){
              // done posting all
              $.get(api + 'suppliers/supplier/' + (isNaN(Number(id)) ? id : Number(id)), function(updated){
                const dueU = parseFloat(updated.amount_due||0);
                const paidU = parseFloat(updated.amount_paid||0);
                const remainingU = Math.max(0, dueU - paidU);
                $("#settle_base_remaining").val(remainingU.toFixed(2));
                $("#settle_remaining").text(`${getCurrencySymbol()}${moneyFormat(remainingU.toFixed(2))}`);

                const final = paidU >= dueU ? 'Paid' : 'Partially Paid';
                $("#settle_status").val(final);

                let h = "";
                (updated.history||[]).forEach(function(ent){
                  const amt = parseFloat(ent.amount||0);
                  h += `\n<tr><td>${getCurrencySymbol()}${moneyFormat(amt.toFixed(2))}</td><td>${_.escape((ent.date||'').substring(0,10))}</td></tr>`;
                });
                $("#supplier_history_body").html(h);

                loadSuppliers();
                notiflix.Report.success(i18next.t('messages.success','Success'), i18next.t('messages.operationSuccess','Operation completed successfully'), 'Ok');
              });
              return;
            }
            const ent = entries[index];
            $.ajax({
              url: api + 'suppliers/supplier/' + (isNaN(Number(id)) ? id : Number(id)) + '/history',
              method: 'POST',
              contentType: 'application/json; charset=utf-8',
              data: JSON.stringify(ent),
              complete: function(){
                // after each post, append immediate row in UI for feedback
                const amt = parseFloat(ent.amount||0);
                $("#supplier_history_body").append(`\n<tr><td>${getCurrencySymbol()}${moneyFormat(amt.toFixed(2))}</td><td>${_.escape((ent.date||'').substring(0,10))}</td></tr>`);
                postHistorySequential(index+1);
              },
            });
          }

          postHistorySequential(0);
          
        },
        error: function(){
          notiflix.Report.failure(i18next.t('messages.error','Error'), i18next.t('messages.operationFailed','Operation failed'), 'Ok');
        }
      });
    });

    $("#saveProduct").submit(function (e) {
      e.preventDefault();

      $(this).attr("action", api + "inventory/product");
      $(this).attr("method", "POST");

      // auto-calc price and benefit before submit
      const market = parseFloat($("#product_market_price").val()||0);
      const our = parseFloat($("#product_our_price").val()||0);
      if (!isNaN(our) && our>0) {
        $("#product_price").val(our.toFixed(2));
      }
      if (!isNaN(market) && !isNaN(our)) {
        $("#product_benefit").val((market-our).toFixed(2));
      }

      $(this).ajaxSubmit({
        contentType: "application/json",
        success: function (response) {
          $("#saveProduct").get(0).reset();
          $("#current_img").text("");

          loadProducts();
          diagOptions = {
            title: "Product Saved",
            text: "Select an option below to continue.",
            okButtonText: "Add another",
            cancelButtonText: "Close",
          };

          notiflix.Confirm.show(
            diagOptions.title,
            diagOptions.text,
            diagOptions.okButtonText,
            diagOptions.cancelButtonText,
            ()=>{},
            () => {
              $("#newProduct").modal("hide");
            },
          );
        },
        //error for product
       error: function (jqXHR,textStatus, errorThrown) {
      console.error(jqXHR.responseJSON.message);
      notiflix.Report.failure(
        jqXHR.responseJSON.error,
        jqXHR.responseJSON.message,
        "Ok",
      );
      }

      });
    });

    $("#saveCategory").submit(function (e) {
      e.preventDefault();

      if ($("#category_id").val() == "") {
        method = "POST";
      } else {
        method = "PUT";
      }

      $.ajax({
        type: method,
        url: api + "categories/category",
        data: $(this).serialize(),
        success: function (data, textStatus, jqXHR) {
          $("#saveCategory").get(0).reset();
          loadCategories();
          loadProducts();
          diagOptions = {
            title: "Category Saved",
            text: "Select an option below to continue.",
            okButtonText: "Add another",
            cancelButtonText: "Close",
          };

          notiflix.Confirm.show(
            diagOptions.title,
            diagOptions.text,
            diagOptions.okButtonText,
            diagOptions.cancelButtonText,
            ()=>{},

            () => {
                $("#newCategory").modal("hide");
            },
          );
        },
      });
    });

    $.fn.editProduct = function (index) {
      $("#Products").modal("hide");

      $("#category option")
        .filter(function () {
          return $(this).val() == allProducts[index].category;
        })
        .prop("selected", true);

      $("#productName").val(allProducts[index].name);
      $("#product_price").val(allProducts[index].price);
      $("#quantity").val(allProducts[index].quantity);
      $("#barcode").val(allProducts[index].barcode || allProducts[index]._id);
      $("#expirationDate").val(allProducts[index].expirationDate);
      $("#minStock").val(allProducts[index].minStock || 1);
      $("#product_id").val(allProducts[index]._id);
      $("#img").val(allProducts[index].img);

      if (allProducts[index].img != "") {
        $("#imagename").hide();
        $("#current_img").html(
          `<img src="${img_path + allProducts[index].img}" alt="">`,
        );
        $("#rmv_img").show();
      }

      if (allProducts[index].stock == 0) {
        $("#stock").prop("checked", true);
      }

      $("#newProduct").modal("show");
    };

    $("#userModal").on("hide.bs.modal", function () {
      $(".perms").hide();
    });

    $.fn.editUser = function (index) {
      user_index = index;

      $("#Users").modal("hide");

      $(".perms").show();

      $("#user_id").val(allUsers[index]._id);
      $("#fullname").val(allUsers[index].fullname);
      $("#username").val(validator.unescape(allUsers[index].username));
      $("#password").attr("placeholder", "New Password");
    

      for (perm of permissions) {
        var el = "#" + perm;
        if (allUsers[index][perm] == 1) {
          $(el).prop("checked", true);
        } else {
          $(el).prop("checked", false);
        }
      }

      $("#userModal").modal("show");
    };

    $.fn.editCategory = function (index) {
      $("#Categories").modal("hide");
      $("#categoryName").val(allCategories[index].name);
      $("#category_id").val(allCategories[index]._id);
      $("#newCategory").modal("show");
    };

    $.fn.deleteProduct = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this product.",
        okButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "inventory/product/" + id,
            type: "DELETE",
            success: function (result) {
              loadProducts();
              notiflix.Report.success("Done!", "Product deleted", "Ok");
            },
          });
        },
      );
    };

    $.fn.deleteUser = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this user.",
        cancelButtonColor: "#d33",
        okButtonText: "Yes, delete!",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "users/user/" + id,
            type: "DELETE",
            success: function (result) {
              loadUserList();
              notiflix.Report.success("Done!", "User deleted", "Ok");
            },
          });
        },
      );
    };

    $.fn.deleteCategory = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this category.",
        okButtonText: "Yes, delete it!",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "categories/category/" + id,
            type: "DELETE",
            success: function (result) {
              loadCategories();
              notiflix.Report.success("Done!", "Category deleted", "Ok");
            },
          });
        },
      );
    };

    $("#productModal").on("click", function () {
      loadProductList();
    });

    $("#usersModal").on("click", function () {
      loadUserList();
    });

    $("#categoryModal").on("click", function () {
      loadCategoryList();
    });

    function loadUserList() {
      let counter = 0;
      let user_list = "";
      $("#user_list").empty();
      $("#userList").DataTable().destroy();

      $.get(api + "users/all", function (users) {
        allUsers = [...users];

        users.forEach((user, index) => {
          state = [];
          let class_name = "";

          if (user.status != "") {
            state = user.status.split("_");
            login_status = state[0];
            login_time = state[1];

            switch (login) {
              case "Logged In":
                class_name = "btn-default";

                break;
              case "Logged Out":
                class_name = "btn-light";
                break;
            }
          }

          counter++;
          user_list += `<tr>
            <td>${user.fullname}</td>
            <td>${user.username}</td>
            <td class="${class_name}">${
              state.length > 0 ? login_status : ""
            } <br><small> ${state.length > 0 ? login_time : ""}</small></td>
            <td>${
              user._id == 1
                ? '<span class="btn-group"><button class="btn btn-dark"><i class="fa fa-edit"></i></button><button class="btn btn-dark"><i class="fa fa-trash"></i></button></span>'
                : '<span class="btn-group"><button onClick="$(this).editUser(' +
                  index +
                  ')" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteUser(' +
                  user._id +
                  ')" class="btn btn-danger"><i class="fa fa-trash"></i></button></span>'
            }</td></tr>`;

          if (counter == users.length) {
            $("#user_list").html(user_list);

            $("#userList").DataTable({
              order: [[1, "desc"]],
              autoWidth: false,
              info: true,
              JQueryUI: true,
              ordering: true,
              paging: false,
            });
          }
        });
      });
    }

    function loadProductList() {
      let products = [...allProducts];
      let product_list = "";
      let counter = 0;
      $("#product_list").empty();
      $("#productList").DataTable().destroy();

      products.forEach((product, index) => {
        counter++;

        let category = allCategories.filter(function (category) {
          return category._id == product.category;
        });

        product.stockAlert = "";
        const todayDate = moment();
        const expiryDate = moment(product.expirationDate, DATE_FORMAT);

        //show stock status indicator
        const stockStatus = getStockStatus(product.quantity,product.minStock);
          if(stockStatus<=0)
          {
          if (stockStatus === 0) {
            product.stockStatus = "No Stock";
            icon = "fa fa-exclamation-triangle";
          }
          if (stockStatus === -1) {
            product.stockStatus = "Low Stock";
            icon = "fa fa-caret-down";
          }

          product.stockAlert = `<p class="text-danger"><small><i class="${icon}"></i> ${product.stockStatus}</small></p>`;
        }
        //calculate days to expiry
        product.expiryAlert = "";
        if (!isExpired(expiryDate)) {
          const diffDays = daysToExpire(expiryDate);

          if (diffDays > 0 && diffDays <= 30) {
            var days_noun = diffDays > 1 ? "days" : "day";
            icon = "fa fa-clock-o";
            product.expiryStatus = `${diffDays} ${days_noun} left`;
            product.expiryAlert = `<p class="text-danger"><small><i class="${icon}"></i> ${product.expiryStatus}</small></p>`;
          }
        } else {
          icon = "fa fa-exclamation-triangle";
          product.expiryStatus = "Expired";
          product.expiryAlert = `<p class="text-danger"><small><i class="${icon}"></i> ${product.expiryStatus}</small></p>`;
        }

        if(product.img==="")
        {
          product_img=default_item_img;
        }
        else
        {
          product_img = img_path + product.img;
          product_img = checkFileExists(product_img)
          ? product_img
          : default_item_img;
        }
        
        //render product list
        product_list +=
          `<tr>
            <td><img id="` +
          product._id +
          `"></td>
            <td><img style="max-height: 50px; max-width: 50px; border: 1px solid #ddd;" src="${product_img}" id="product_img"></td>
            <td>${product.name}
            ${product.expiryAlert}</td>
            <td>${getCurrencySymbol()}${product.price}</td>
            <td>${product.stock == 1 ? product.quantity : "N/A"}
            ${product.stockAlert}
            </td>
            <td>${product.expirationDate}</td>
            <td>${category.length > 0 ? category[0].name : ""}</td>
            <td class="nobr"><span class="btn-group"><button onClick="$(this).editProduct(${index})" class="btn btn-warning btn-sm"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteProduct(${
              product._id
            })" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i></button></span></td></tr>`;

        if (counter == allProducts.length) {
          $("#product_list").html(product_list);

          products.forEach((product) => {
            let bcode = product.barcode || product._id;
            $("#" + product._id + "").JsBarcode(bcode, {
              width: 2,
              height: 25,
              fontSize: 14,
            });
          });
        }
      });

      $("#productList").DataTable({
        order: [[1, "desc"]],
        autoWidth: false,
        info: true,
        JQueryUI: true,
        ordering: true,
        paging: false,
        dom: "Bfrtip",
        buttons: [
          {
            extend: "pdfHtml5",
            className: "btn btn-light", // Custom class name
            text: " Download PDF", // Custom text
            filename: "product_list.pdf", // Default filename
          },
        ],
      });
    }

    function loadCategoryList() {
      let category_list = "";
      let counter = 0;
      $("#category_list").empty();
      $("#categoryList").DataTable().destroy();

      allCategories.forEach((category, index) => {
        counter++;

        category_list += `<tr>
     
            <td>${category.name}</td>
            <td><span class="btn-group"><button onClick="$(this).editCategory(${index})" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteCategory(${category._id})" class="btn btn-danger"><i class="fa fa-trash"></i></button></span></td></tr>`;
      });

      if (counter == allCategories.length) {
        $("#category_list").html(category_list);
        $("#categoryList").DataTable({
          autoWidth: false,
          info: true,
          JQueryUI: true,
          ordering: true,
          paging: false,
        });
      }
    }


    $("#log-out").on("click", function () {
      const diagOptions = {
        title: "Are you sure?",
        text: "You are about to log out.",
        cancelButtonColor: "#3085d6",
        okButtonText: "Logout",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.get(api + "users/logout/" + user._id, function (data) {
            storage.delete("auth");
            storage.delete("user");
            ipcRenderer.send("app-reload", "");
          });
        },
      );
    });

    $("#settings_form").on("submit", function (e) {
      e.preventDefault();
      let formData = $(this).serializeObject();
      let mac_address;

      api = "http://" + host + ":" + port + "/api/";

      macaddress.one(function (err, mac) {
        mac_address = mac;
      });
      const appChoice = $("#app").find("option:selected").text();
    
      formData["app"] = appChoice;
      formData["mac"] = mac_address;
      formData["till"] = 1;

      // Update application field in settings form
      let $appField = $("#settings_form input[name='app']");
      let $hiddenAppField = $('<input>', {
        type: 'hidden',
        name: 'app',
        value: formData.app
    });
        $appField.length 
            ? $appField.val(formData.app) 
            : $("#settings_form").append(`<input type="hidden" name="app" value="${$hiddenAppField}" />`);


      if (formData.percentage != "" && typeof formData.percentage === 'number') {
        notiflix.Report.warning(
          "Oops!",
          "Please make sure the tax value is a number",
          "Ok",
        );
      } else {
        storage.set("settings", formData);

        $(this).attr("action", api + "settings/post");
        $(this).attr("method", "POST");

        $(this).ajaxSubmit({
          contentType: "application/json",
          success: function () {
            ipcRenderer.send("app-reload", "");
          },
          error: function (jqXHR) {
            console.error(jqXHR.responseJSON.message);
            notiflix.Report.failure(
              jqXHR.responseJSON.error,
              jqXHR.responseJSON.message,
              "Ok",
            );
      }
    });
    }
  });

    $("#net_settings_form").on("submit", function (e) {
      e.preventDefault();
      let formData = $(this).serializeObject();

      if (formData.till == 0 || formData.till == 1) {
        notiflix.Report.warning(
          "Oops!",
          "Please enter a number greater than 1.",
          "Ok",
        );
      } else {
        if (isNumeric(formData.till)) {
          formData["app"] = $("#app").find("option:selected").text();
          storage.set("settings", formData);
          ipcRenderer.send("app-reload", "");
        } else {
          notiflix.Report.warning(
            "Oops!",
            "Till number must be a number!",
            "Ok",
          );
        }
      }
    });

    $("#saveUser").on("submit", function (e) {
      e.preventDefault();
      let formData = $(this).serializeObject();

      if (formData.password != formData.pass) {
        notiflix.Report.warning("Oops!", "Passwords do not match!", "Ok");
      }

      if (
        bcrypt.compare(formData.password, user.password) ||
        bcrypt.compare(formData.password, allUsers[user_index].password)
      ) {
        $.ajax({
          url: api + "users/post",
          type: "POST",
          data: JSON.stringify(formData),
          contentType: "application/json; charset=utf-8",
          cache: false,
          processData: false,
          success: function (data) {
            if (ownUserEdit) {
              ipcRenderer.send("app-reload", "");
            } else {
              $("#userModal").modal("hide");

              loadUserList();

              $("#Users").modal("show");
              notiflix.Report.success("Great!", "User details saved!", "Ok");
            }
          },
          error: function (jqXHR,textStatus, errorThrown) {
            notiflix.Report.failure(
              jqXHR.responseJSON.error,
              jqXHR.responseJSON.message,
              "Ok",
            );
          },
        });
      }
    });

    $("#app").on("change", function () {
      if (
        $(this).find("option:selected").text() ==
        "Network Point of Sale Terminal"
      ) {
        $("#net_settings_form").show(500);
        $("#settings_form").hide(500);
        macaddress.one(function (err, mac) {
          $("#mac").val(mac);
        });
      } else {
        $("#net_settings_form").hide(500);
        $("#settings_form").show(500);
      }
    });

    $("#cashier").on("click", function () {
      ownUserEdit = true;

      $("#userModal").modal("show");

      $("#user_id").val(user._id);
      $("#fullname").val(user.fullname);
      $("#username").val(user.username);
      $("#password").attr("placeholder", "New Password");

      for (perm of permissions) {
        var el = "#" + perm;
        if (allUsers[index][perm] == 1) {
          $(el).prop("checked", true);
        } else {
          $(el).prop("checked", false);
        }
      }
    });

    $("#add-user").on("click", function () {
      if (platform.app != "Network Point of Sale Terminal") {
        $(".perms").show();
      }

      $("#saveUser").get(0).reset();
      $("#userModal").modal("show");
    });

    $("#settings").on("click", function () {
      if (platform.app == "Network Point of Sale Terminal") {
        $("#net_settings_form").show(500);
        $("#settings_form").hide(500);

        $("#ip").val(platform.ip);
        $("#till").val(platform.till);

        macaddress.one(function (err, mac) {
          $("#mac").val(mac);
        });

        $("#app option")
          .filter(function () {
            return $(this).text() == platform.app;
          })
          .prop("selected", true);
      } else {
        $("#net_settings_form").hide(500);
        $("#settings_form").show(500);

        $("#settings_id").val("1");
        $("#store").val(validator.unescape(settings.store));
        $("#address_one").val(validator.unescape(settings.address_one));
        $("#address_two").val(validator.unescape(settings.address_two));
        $("#contact").val(validator.unescape(settings.contact));
        $("#tax").val(validator.unescape(settings.tax));
        $("#symbol").val(validator.unescape(settings.symbol));
        $("#percentage").val(validator.unescape(settings.percentage));
        $("#footer").val(validator.unescape(settings.footer));
        $("#logo_img").val(validator.unescape(settings.img));
        if (settings.charge_tax) {
          $("#charge_tax").prop("checked", true);
        }
        if (validator.unescape(settings.img) != "") {
          $("#logoname").hide();
          $("#current_logo").html(
            `<img src="${img_path + validator.unescape(settings.img)}" alt="">`,
          );
          $("#rmv_logo").show();
        }

        $("#app option")
          .filter(function () {
            return $(this).text() == validator.unescape(settings.app);
          })
          .prop("selected", true);
      }
    });
 });

  $("#rmv_logo").on("click", function () {
    $("#remove_logo").val("1");
    // $("#logo_img").val('');
    $("#current_logo").hide(500);
    $(this).hide(500);
    $("#logoname").show(500);
  });

  $("#rmv_img").on("click", function () {
    $("#remove_img").val("1");
    // $("#img").val('');
    $("#current_img").hide(500);
    $(this).hide(500);
    $("#imagename").show(500);
  });
}

$.fn.print = function () {
  printJS({ printable: receipt, type: "raw-html" });
};

function loadTransactions() {
  let tills = [];
  let users = [];
  let sales = 0;
  let transact = 0;
  let unique = 0;

  sold_items = [];
  sold = [];

  let counter = 0;
  let transaction_list = "";
  let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;

  $.get(api + query, function (transactions) {
    if (transactions.length > 0) {
      $("#transaction_list").empty();
      $("#transactionList").DataTable().destroy();

      allTransactions = [...transactions];

      transactions.forEach((trans, index) => {
        sales += parseFloat(trans.total);
        transact++;

        trans.items.forEach((item) => {
          sold_items.push(item);
        });

        if (!tills.includes(trans.till)) {
          tills.push(trans.till);
        }

        if (!users.includes(trans.user_id)) {
          users.push(trans.user_id);
        }

        counter++;
        transaction_list += `<tr>
                                <td>${trans.order}</td>
                                <td class="nobr">${moment(trans.date).format(
                                  "DD-MMM-YYYY HH:mm:ss",
                                )}</td>
                                <td>${
                                  getCurrencySymbol() + moneyFormat(trans.total)
                                }</td>
                                <td>${
                                  trans.paid == ""
                                    ? ""
                                    : getCurrencySymbol() + moneyFormat(trans.paid)
                                }</td>
                                <td>${
                                  trans.change
                                    ? getCurrencySymbol() +
                                      moneyFormat(
                                        Math.abs(trans.change).toFixed(2),
                                      )
                                    : ""
                                }</td>
                                <td>${
                                  trans.paid == ""
                                    ? ""
                                    : trans.payment_type
                                }</td>
                                <td>${trans.till}</td>
                                <td>${trans.user}</td>
                                <td>${
                                  trans.paid == ""
                                    ? '<button class="btn btn-dark"><i class="fa fa-search-plus"></i></button>'
                                    : '<button onClick="$(this).viewTransaction(' +
                                      index +
                                      ')" class="btn btn-info"><i class="fa fa-search-plus"></i></button></td>'
                                }</tr>
                    `;

        if (counter == transactions.length) {
          $("#total_sales #counter").text(
            getCurrencySymbol() + moneyFormat(parseFloat(sales).toFixed(2)),
          );
          $("#total_transactions #counter").text(transact);

          const result = {};

          for (const { product_name, price, quantity, id } of sold_items) {
            if (!result[product_name]) result[product_name] = [];
            result[product_name].push({ id, price, quantity });
          }

          for (item in result) {
            let price = 0;
            let quantity = 0;
            let id = 0;

            result[item].forEach((i) => {
              id = i.id;
              price = i.price;
              quantity = quantity + parseInt(i.quantity);
            });

            sold.push({
              id: id,
              product: item,
              qty: quantity,
              price: price,
            });
          }

          loadSoldProducts();

          if (by_user == 0 && by_till == 0) {
            userFilter(users);
            tillFilter(tills);
          }

          $("#transaction_list").html(transaction_list);
          $("#transactionList").DataTable({
            order: [[1, "desc"]],
            autoWidth: false,
            info: true,
            JQueryUI: true,
            ordering: true,
            paging: true,
            dom: "Bfrtip",
            buttons: ["csv", "excel", "pdf"],
          });
        }
      });
    } else {
      notiflix.Report.warning(
        "No data!",
        "No transactions available within the selected criteria",
        "Ok",
      );
    }
  });
}

function sortDesc(a, b) {
  if (a.qty > b.qty) {
    return -1;
  }
  if (a.qty < b.qty) {
    return 1;
  }
  return 0;
}

function loadSoldProducts() {
  sold.sort(sortDesc);

  let counter = 0;
  let sold_list = "";
  let items = 0;
  let products = 0;
  $("#product_sales").empty();

  sold.forEach((item, index) => {
    items = items + parseInt(item.qty);
    products++;

    let product = allProducts.filter(function (selected) {
      return selected._id == item.id;
    });

    counter++;

    sold_list += `<tr>
            <td>${item.product}</td>
            <td>${item.qty}</td>
            <td>${
              product.length > 0 && product[0].stock == 1
                ? product[0].quantity
                : "N/A"
            }</td>
            <td>${
              getCurrencySymbol() +
              moneyFormat((item.qty * parseFloat(item.price)).toFixed(2))
            }</td>
            </tr>`;

    if (counter == sold.length) {
      $("#total_items #counter").text(items);
      $("#total_products #counter").text(products);
      $("#product_sales").html(sold_list);
    }
  });
}

function userFilter(users) {
  $("#users").empty();
  $("#users").append(`<option value="0">All</option>`);

  users.forEach((user) => {
    let u = allUsers.filter(function (usr) {
      return usr._id == user;
    });

    $("#users").append(`<option value="${user}">${u.length > 0 ? u[0].fullname : 'Unknown User'}</option>`);
  });
}

function tillFilter(tills) {
  $("#tills").empty();
  $("#tills").append(`<option value="0">All</option>`);
  tills.forEach((till) => {
    $("#tills").append(`<option value="${till}">${till}</option>`);
  });
}

$.fn.viewTransaction = function (index) {
  transaction_index = index;

  let discount = allTransactions[index].discount;
  let customer =
    allTransactions[index].customer == 0
      ? "Walk in Customer"
      : allTransactions[index].customer.username;
  let refNumber =
    allTransactions[index].ref_number != ""
      ? allTransactions[index].ref_number
      : allTransactions[index].order;
  let orderNumber = allTransactions[index].order;
  let paymentMethod = "";
  let tax_row = "";
  let items = "";
  let products = allTransactions[index].items;

  products.forEach((item) => {
    items += `<tr><td>${item.product_name}</td><td>${
      item.quantity
    } </td><td class="text-right"> ${getCurrencySymbol()} ${moneyFormat(
      Math.abs(item.price).toFixed(2),
    )} </td></tr>`;
  });

  paymentMethod = allTransactions[index].payment_type;
 

  if (allTransactions[index].paid != "") {
    payment = `<tr>
                    <td>Paid</td>
                    <td>:</td>
                    <td class="text-right">${getCurrencySymbol()} ${moneyFormat(
                      Math.abs(allTransactions[index].paid).toFixed(2),
                    )}</td>
                </tr>
                <tr>
                    <td>Change</td>
                    <td>:</td>
                    <td class="text-right">${getCurrencySymbol()} ${moneyFormat(
                      Math.abs(allTransactions[index].change).toFixed(2),
                    )}</td>
                </tr>
                <tr>
                    <td>Method</td>
                    <td>:</td>
                    <td class="text-right">${paymentMethod}</td>
                </tr>`;
  }

  if (settings.charge_tax) {
    tax_row = `<tr>
                <td>Vat(${getVATPercentage()})% </td>
                <td>:</td>
                <td class="text-right">${getCurrencySymbol()}${parseFloat(
                  allTransactions[index].tax,
                ).toFixed(2)}</td>
            </tr>`;
  }

    logo = path.join(img_path, validator.unescape(settings.img));
      
      receipt = `<div style="font-size: 12px">                            
        <p style="text-align: center;">
        ${
          checkFileExists(logo)
            ? `<img style='max-width: 50px' src='${logo}' /><br>`
            : ``
        }
            <span style="font-size: 22px;">${validator.unescape(settings.store)}</span> <br>
            ${validator.unescape(settings.address_one)} <br>
            ${validator.unescape(settings.address_two)} <br>
            ${
              validator.unescape(settings.contact) != "" ? "Tel: " + validator.unescape(settings.contact) + "<br>" : ""
            } 
            ${validator.unescape(settings.tax) != "" ? "Vat No: " + validator.unescape(settings.tax) + "<br>" : ""} 
    </p>
    <hr>
    <left>
        <p>
        ඉන්වොයිස් : ${orderNumber} <br>
        යොමු අංකය : ${refNumber} <br>
        ගැණුම්කරු : ${
          allTransactions[index].customer == 0 || !allTransactions[index].customer
            ? "Walk in Customer"
            : allTransactions[index].customer.name
        } <br>
        කැෂියර් : ${allTransactions[index].user} <br>
        දිනය : ${moment(allTransactions[index].date).format(
          "DD MMM YYYY HH:mm:ss",
        )}<br>
        </p>

    </left>
    <hr>
    <table width="90%">
        <thead>
        <tr>
            <th>අයිතම</th>
            <th>ප්‍රමාණය</th>
            <th class="text-right">මිල</th>
        </tr>
        </thead>
        <tbody>
        ${items}                
        <tr><td colspan="3"><hr></td></tr>
        <tr>                        
            <td><b>මුළු වටිනාකම</b></td>
            <td>:</td>
            <td class="text-right"><b>${getCurrencySymbol()}${moneyFormat(
              allTransactions[index].subtotal,
            )}</b></td>
        </tr>
        <tr>
            <td>Discount</td>
            <td>:</td>
            <td class="text-right">${
              discount > 0
                ? getCurrencySymbol() +
                  moneyFormat(
                    parseFloat(allTransactions[index].discount).toFixed(2),
                  )
                : ""
            }</td>
        </tr>
        
        ${tax_row}
    
        <tr>
            <td><h5>මුළු</h5></td>
            <td><h5>:</h5></td>
            <td class="text-right">
                <h5>${getCurrencySymbol()}${moneyFormat(
                  allTransactions[index].total,
                )}</h5>
            </td>
        </tr>
        ${payment == 0 ? "" : payment}
        </tbody>
        </table>
        <br>
        <hr>
        <br>
        <p style="text-align: center;">
         ${validator.unescape(settings.footer)}
         </p>
        </div>`;

        //prevent DOM XSS; allow windows paths in img src
        receipt = DOMPurify.sanitize(receipt,{ ALLOW_UNKNOWN_PROTOCOLS: true });

  $("#viewTransaction").html("");
  $("#viewTransaction").html(receipt);

  $("#orderModal").modal("show");
};

$("#status").on("change", function () {
  by_status = $(this).find("option:selected").val();
  loadTransactions();
});

$("#tills").on("change", function () {
  by_till = $(this).find("option:selected").val();
  loadTransactions();
});

$("#users").on("change", function () {
  by_user = $(this).find("option:selected").val();
  loadTransactions();
});

$("#reportrange").on("apply.daterangepicker", function (ev, picker) {
  start = picker.startDate.format("DD MMM YYYY hh:mm A");
  end = picker.endDate.format("DD MMM YYYY hh:mm A");

  start_date = picker.startDate.toDate().toJSON();
  end_date = picker.endDate.toDate().toJSON();

  loadTransactions();
});

function authenticate() {
  $(".loading").hide();
  $("body").attr("class", "login-page");
  $("#login").show();
}

$("body").on("submit", "#account", function (e) {
  e.preventDefault();
  let formData = $(this).serializeObject();

  if (formData.username == "" || formData.password == "") {
    notiflix.Report.warning("Incomplete form!", auth_empty, "Ok");
  } else {
    $.ajax({
      url: api + "users/login",
      type: "POST",
      data: JSON.stringify(formData),
      contentType: "application/json; charset=utf-8",
      cache: false,
      processData: false,
      success: function (data) {
        if (data.auth === true) {
          storage.set("auth", { auth: true });
          storage.set("user", data);
          ipcRenderer.send("app-reload", "");
          $("#login").hide();
        } else {
          notiflix.Report.warning("Oops!", auth_error, "Ok");
        }
      },
      error: function (data) {
        console.log(data);
      },
    });
  }
});

$("#quit").on("click", function () {
  const diagOptions = {
    title: "Are you sure?",
    text: "You are about to close the application.",
    icon: "warning",
    okButtonText: "Close Application",
    cancelButtonText: "Cancel"
  };

  notiflix.Confirm.show(
    diagOptions.title,
    diagOptions.text,
    diagOptions.okButtonText,
    diagOptions.cancelButtonText,
    () => {
      ipcRenderer.send("app-quit", "");
    },
  );
});

ipcRenderer.on("click-element", (event, elementId) => {
  document.getElementById(elementId).click();
});