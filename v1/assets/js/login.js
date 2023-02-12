if(getCookie("__token")!=""){
	window.location = "kanban.html";
}

$(document).ready(function(e){
	$("#login-form").submit(function(e){
		e.preventDefault();
		var register = new Service({
			end_point:"auth/login",
			method:"POST",
			data:$(this).serializeArray(),
			onSuccess:function(response){
				if(response['auth_token']){
					setCookie("__token",response['auth_token']);
				}
				window.location = "kanban.html";
			},
			onError:function(response){
				alert(response.message);
			}
		});
	});

	$("#register-form").submit(function(e){
		e.preventDefault();
		var register = new Service({
			end_point:"signup",
			method:"POST",
			data:$(this).serializeArray(),
			onSuccess:function(response){
				if(response['auth_token']){
					setCookie("__token",response['auth_token']);
				}
				window.location = "kanban.html";
			},
			onError:function(response){
				alert(response.message);
			}
		});
	});
});