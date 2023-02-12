function Service(options){
	
	var self = this;
	$.extend(this,options);

	var settings = {
		"url" : "https://todo-api-18-140-52-65.rakamin.com/"+this.end_point,
		"method": this.method,
		"data":(this.data)?this.getData(this.data):"",
		"dataType": "json",
		"contentType": "application/json; charset=utf-8",
		"timeout": 0
	};

	if(getCookie("__token")!=""){
		$.extend(settings,{
			beforeSend: function (xhr) {
			    xhr.setRequestHeader('Authorization', 'Bearer '+getCookie("__token"));
			}
		});
	}

	$.ajax(settings)
	.done(function (response) {
	  self.onSuccess(response);
	})
	.fail(function(jqXHR, textStatus) {
		if(jqXHR.readyState==4 && jqXHR.responseText!=""){
			self.onError(JSON.parse(jqXHR.responseText));
		}
  	});
	
}

Service.prototype.getData = function(data) {
	var ret = {};
    for (var i = 0; i < data.length; i++){
        ret[data[i]['name']] = data[i]['value'];
    }
    return JSON.stringify(ret);
};


function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
    }
}
return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function deleteAllCookies() {
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
}

function logout(){
	deleteAllCookies();
	window.location = "./";
}