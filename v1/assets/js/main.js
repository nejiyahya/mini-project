if(getCookie("__token")==""){
	window.location = "./";
}

function Main(){
	var self = this;
	this.arr_group = {};
	this.current_style = 0;
	this.act_ready = true;
	this.assets = [
		{name:"group_templete",file:"templete/group-templete.html"},
		{name:"task_templete",file:"templete/task-templete.html"}];

	this.drag = dragula({})
	  	.on('drop', function (el, container) {
	  		$(container).children().length == 0?$(container).addClass("no-task"):$(container).removeClass("no-task");
	  		self.move_task(el);
	  	})
	  	.on('drag', function (el, container) {
	  		$(container).children().length == 1?$(container).addClass("no-task"):$(container).removeClass("no-task");
	  	});

	
	$("body").on('click','#submit-new-group',function(e){
		e.preventDefault();
		if(self.act_ready){
			self.act_ready = false;
			self.add_group();
		}
	});

	$("body").on('click','#submit-new-task',function(e){
		e.preventDefault();
		if(self.act_ready){
			self.act_ready = false;
			self.add_task();
		}
	});

	$("body").on('click','#submit-edit-task',function(e){
		e.preventDefault();
		if(self.act_ready){
			self.act_ready = false;
			self.edit_task();
		}
	});

	$("body").on('click','#submit-delete-task',function(e){
		e.preventDefault();
		if(self.act_ready){
			self.act_ready = false;
			self.delete_task();
		}
	});

	this.load_assets();
}

Main.prototype.load_assets = function() {
	var self = this;
	for (var i = 0; i < this.assets.length; i++) {
		this.fatch({
			name:self.assets[i].name,
			file:self.assets[i].file,
			callback:function(){
				if(self.count_assets == undefined){
					self.count_assets = 0;
				}

				self.count_assets++;

				if(self.count_assets == self.assets.length){
					self.get_data();
				}
			}
		});
	}	
};

Main.prototype.fatch = function(options) {
	var self = this;
	fetch(options.file)
	.then(response=> response.text())
	.then(text=> self[options.name] = text, options.callback());
};

Main.prototype.get_data = function() {
	var self = this;
	var service_group = new Service({
		end_point:"todos",
		method:"GET",
		onSuccess:function(response){
			for (var i = 0; i < response.length; i++) {
				var group = new Group({
					"id":response[i].id,
					"title":response[i].title,
					"description":response[i].description,
					"templete":self.group_templete,
					"task_templete":self.task_templete
				});
				self.arr_group[response[i].id]=group;
			}
		},
		onError:function(response){
			alert(response);
		}
	});
};

Main.prototype.add_group = function() {
	var self = this;
	var service_group = new Service({
		end_point:"todos",
		method:"POST",
		data:$("#form-add-new-group").serializeArray(),
		onSuccess:function(response){
			var group = new Group({
				"id":response.id,
				"title":response.title,
				"description":response.description,
				"templete":self.group_templete
			});
			self.arr_group[response.id]=group;
			$("#add-new-group").modal("hide");
			$("#form-add-new-group")[0].reset();
			self.act_ready = true;
		},
		onError:function(response){
			alert(response);
		}
	});
};

Main.prototype.add_task = function() {
	var self = this;	
	var group_id = $("#form-add-new-task").attr("group_id");
	var service_items = new Service({
		end_point:"todos/"+group_id+"/items",
		method:"POST",
		data:$("#form-add-new-task").serializeArray(),
		onSuccess:function(response){
			var task = new Task({
				"id":response.id,
				"name":response.name,
				"done":response.done,
				"progress_percentage":response.progress_percentage,
				"templete":self.task_templete,
				"parent_element":self.arr_group[group_id].element
			});

			self.arr_group[group_id].arr_task[response.id] = task;
			$("#add-new-task").modal('hide');
			$("#form-add-new-task")[0].reset();
			self.act_ready = true;
		},
		onError:function(response){
			alert(response);
		}
	});
};

Main.prototype.edit_task = function() {
	var self = this;
	var task = null;
	var group = null;
	var params = $("#form-edit-task").serializeArray();
	var id = $("#form-edit-task").attr("task_id");

	for(var i in this.arr_group){
		var task_list = this.arr_group[i].arr_task;
		for(var j in task_list){
			if(task_list[j].id==id){
				task = task_list[j];
				group = this.arr_group[i];
				break;
			}
		}

		if(task != null && group != null){
			break;
		}
	}

	for(var i in params){
		task[params[i].name] = params[i].value;
	}

	params.push({"name":"target_todo_id","value":group.id});

	var service = new Service({
		end_point:"todos/"+group.id+"/items/"+task.id,
		method:"PATCH",
		data:params,
		onSuccess:function(response){
			task.render();
			$("#edit-task").modal('hide');
			self.act_ready = true;
		},
		onError:function(response){
			alert(response);
		}
	});
};


Main.prototype.move_task = function(current_task) {
	var prev_group = null;
	var target_group = null;
	var task = null;
	for(var i in this.arr_group){

		if(prev_group == null){
			var task_list = this.arr_group[i].arr_task;
			for(var j in task_list){
				if(task_list[j].element.get(0)==current_task){
					task = task_list[j];
					prev_group = this.arr_group[i];
					break;
				}
			}
		}

		if($(current_task).parents(".task-group").get(0) == this.arr_group[i].element.get(0)){
			target_group = this.arr_group[i];
		}

		if(target_group!=null && prev_group!=null){
			break;
		}
	}

	if(target_group!=prev_group){
		target_group.arr_task[task['id']]=prev_group.arr_task[task['id']];
		delete prev_group.arr_task[task['id']];
	}

	var params = [
			{"name":"target_todo_id","value":target_group.id},
			{"name":"name","value":task.name}
		];
	var service = new Service({
		end_point:"todos/"+prev_group.id+"/items/"+task.id,
		method:"PATCH",
		data:params,
		onSuccess:function(response){
			self.act_ready = true;
		},
		onError:function(response){
			alert(response);
		}
	});

};

Main.prototype.delete_task = function() {
	var self = this;
	var task = null;
	var group = null;
	var id = $("#delete-task").attr("task_id");

	for(var i in this.arr_group){
		var task_list = this.arr_group[i].arr_task;
		for(var j in task_list){
			if(task_list[j].id==id){
				task = task_list[j];
				group = this.arr_group[i];
				break;
			}
		}

		if(task != null && group != null){
			break;
		}
	}

	var service = new Service({
		end_point:"todos/"+group.id+"/items/"+task.id,
		method:"DELETE",
		timeout:0,
		onSuccess:function(response){
			$(task.element).remove();
			delete group.arr_task[task.id];
			$("#delete-task").modal('hide');
			self.act_ready = true;
		},
		onError:function(response){
			alert(response);
		}
	});
};

// GROUP
function Group(options){
	var self = this;
	this.arr_task = {};
	$.extend(this,options);

	self.element = $(this.templete);
	self.element.find(".group-name").html(this.title);
	self.element.find(".group-description").html(this.description);
	self.element.find(".btn-new-task").attr("data-bs-group_id",self.id);
	self.element.addClass("task-group-style-"+(main.current_style%4+1));

	var service_items = new Service({
			end_point:"todos/"+self.id+"/items",
			method:"GET",
			onSuccess:function(response){
				for (var i = 0; i < response.length; i++) {
					var task = new Task({
						"id":response[i].id,
						"name":response[i].name,
						"done":response[i].done,
						"progress_percentage":response[i].progress_percentage,
						"templete":self.task_templete,
						"parent_element":self.element
					});
					self.arr_task[response[i].id]=task;
				}

				if(response.length == 0){
					$(self.element).find(".task-container").addClass("no-task");
				}
			},
			onError:function(response){
				alert(response);
			}
	});

	$(".task-kanban-container").append(self.element);

	var add_new_task = document.getElementById('add-new-task')
	add_new_task.addEventListener('show.bs.modal', function (event) {
		var button = event.relatedTarget;
		var group_id = button.getAttribute('data-bs-group_id');
		$("#form-add-new-task").attr("group_id",group_id);
	});

	main.drag.containers.push($(self.element).find(".task-container").get(0));
	main.current_style++;
}

// TASK
function Task(options){
	var self = this;
	$.extend(this,options);

	self.element = $(this.templete);
	
	this.render();
	self.parent_element.find(".task-container").append(self.element);
	
	$(self.element).find(".move-right").click(function(e){
		e.preventDefault();
		$(this).parents(".task-group").next().find(".task-container").append(self.element);
		if($(this).parents(".task-container").children().length==0){
			$(this).addClass('no-task');
		}
		else{
			$(this).removeClass('no-task');
		}
		main.move_task(self.element.get(0));
	});

	$(self.element).find(".move-left").click(function(e){
		e.preventDefault();
		$(this).parents(".task-group").prev().find(".task-container").append(self.element);
		if($(this).parents(".task-container").children().length==0){
			$(this).addClass('no-task');
		}
		else{
			$(this).removeClass('no-task');
		}
		main.move_task(self.element.get(0));
	});

	$(self.element).find(".edit-task").click(function(e){
		e.preventDefault();
	});

	var edit_task = document.getElementById('edit-task')
	edit_task.addEventListener('show.bs.modal', function (event) {
		var button = event.relatedTarget;
		var task_id = button.getAttribute('data-bs-task_id');
		$("#form-edit-task").attr("task_id",task_id);
	});

	var delete_task = document.getElementById('delete-task')
	delete_task.addEventListener('show.bs.modal', function (event) {
		var button = event.relatedTarget;
		var task_id = button.getAttribute('data-bs-task_id');
		$("#delete-task").attr("task_id",task_id);
	});
}

Task.prototype.render = function() {
	this.element.find(".task-name").html(this.name);
	var background = "bg-primary";
	if(Math.floor(this.progress_percentage)==100){
		this.element.find(".task-status").html('<i class="fa fa-check-circle" aria-hidden="true"></i>');
		background = "bg-success";
	}
	else{
		if(this.progress_percentage == null){
			this.progress_percentage = 0;
		}
		this.element.find(".task-status").html(this.progress_percentage+"%");
	}
	
	this.element.find(".progress-bar").css("width",Math.floor(this.progress_percentage)+"%");
	this.element.find(".progress-bar").removeClass("bg-success bg-primary").addClass(background);
	this.element.find(".progress-bar").attr("aria-valuenow",Math.floor(this.progress_percentage));
	this.element.find(".edit-task").attr("data-bs-task_id",this.id);
	this.element.find(".delete-task").attr("data-bs-task_id",this.id);
};