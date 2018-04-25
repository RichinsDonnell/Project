

paper.install(window);
window.addEventListener("load" , onWindowLoad); 

array_to_monitor = "array"; 

var element_to_animate;
var element_to_animate_from ; 
var element_to_animate_to;  

var user_entered_variables = [];
var to_monitor = [] ; 

var editor ; 

function onWindowLoad()
{
	let canvas =  document.getElementById("myCanvas") ; 
	context = canvas.getContext('2d'); 
	
	//context.font= "12px cFont";
	canvas.setAttribute("width" , "" +document.getElementById("visualizer").getBoundingClientRect().width ) ; 

	/* setup paper */ 
	paper.setup('myCanvas');

	canvas.style.border ="none" ; 
	unpause = false ; 
	generateAst(); 

	/* setup ace */
	editor = ace.edit("editor");
    	editor.setTheme("ace/theme/custom");
	editor.setOptions({showPrintMargin :false , highlightActiveLine  : false, behavioursEnabled: false }) ;
    	editor.session.setMode("ace/mode/javascript");
	setInterval(codeEditorChange, 1500); 

	/* resize the separator */ 
	let separator = document.getElementById("separator"); 
	let left = document.getElementById("editor");
	let right = document.getElementById("visualizer") 
	separator.style.width = right.getBoundingClientRect().x - (left.getBoundingClientRect().x + left.getBoundingClientRect().width) ; 	

	/* position the separator */ 
	//let style = window.getComputedStyle(left); 
	//separator.style.left =  left.getBoundingClientRect().x + left.getBoundingClientRect().width ; 

	/*?!??!?!?!?!?!?!!?!?!?!?!!?!? Uncomment ONE of the following 'program' variables */
	
	// #Uncomment the line below to see visualizations of the heterogeneous array growing , and being modified  
	//program = "var a = 1 ;array = []; array.push(100); while((a < 200) ) { if(a===2) array.push('String test'); if(a===3)array.push('A String') ; array.push(a) ;array[a] =array[a-1]; a++; }  " ; 		// #insertion sort --- Uncomment the line below to see visualizations of an insertion sort algorithm
	// program = "var array = [54, 26, 93, 17, 77, 31,  44, 55] ;var i = 0, j= 0 ; while( i  < array.length) { let value = array[i]; var j = i -1 ; while (j > -1 && array[j] > value){ array[j + 1] = array[j] ;   j-- ; }  array[j + 1]= value ; i++ ; }  "; 
	// program = "var array = [54, 26, 93, 17, 77, 31,  44, 55] ;var i = -1; while (++i < array.length ) { var m = j = i; while( ++j < array.length ) { if (array[m] > array[j]) m = j ; } var t = array[m] ; array[m] = array[i] ; array[i] = t ; } console.log(array)";
	program = "var array = [54, 26, 93, 17, 77, 31,  44, 55];  var increment = array.length / 2; while (increment > 0) { for (i = increment; i < array.length; i++) { var j = i; var temp = array[i]; while (j >= increment && array[j-increment] > temp) { array[j] = array[j-increment]; j = j - increment;} array[j] = temp;} if (increment == 2) { increment = 1; } else { increment = parseInt(increment*5 / 11);}} console.log(array)"
	// remove this 
	program = astring.generate(esprima.parse(program))
	editor.setValue(program); 
}


function codeEditorChange()
{
	p = editor.getSession().getValue() ;
	getGlobalVariablesFromCode(esprima.parse(p));
	generateCheckboxes(); 
	
}

function generateCheckboxes()
{

	let container = document.getElementById("selector"); 

	let to_compare = [];  
	let checkboxes = document.getElementsByClassName("vchk");
	let create_elements = true ; 
	if(checkboxes.length != 0 )
	{
		for(let i = 0 ; i < checkboxes.length ; i++) 
		{	
			to_compare.push(checkboxes[i].getAttribute("variable")) ; 
		}	

		let left_over = to_compare.filter(function (item , pos) 
			{
				if(user_entered_variables.indexOf(item) === -1)
					return true ; 
				else 
					return false ;  
			}) ; 

		if(left_over.length != 0 )
		{
			container.innerHTML = "" ; 
			create_elements = true ;  
		}
		else 
			create_elements = false ; 
	}

	if(create_elements)
	{
		user_entered_variables = user_entered_variables.filter(function(item , pos) 
			{ return user_entered_variables.indexOf(item) == pos;  });

		 
			for (i in user_entered_variables)
			{	
				let label = document.createElement("Label") ; 
				label.setAttribute("class" , "check-container"); 
				label.innerHTML = user_entered_variables[i] ; 
					let input = document.createElement("input");
					input.setAttribute("type" ,  "checkbox"  );
					input.setAttribute("class" , "vchk")
					input.setAttribute("variable" , user_entered_variables[i]); 
			
					let span = document.createElement("span"); 
					span.setAttribute("class" , "checkmark");

				label.appendChild(input) ; 
				label.appendChild(span); 
			
				container.appendChild(label); 
		
		
			}
	}
}


function runSimulaton()
{	
	getVariablesToMonitor() ; 
	
	program = editor.session.getValue(); 
	/* generate abstract syntax tree */ 
	ast = esprima.parse(program, {loc: true}); 
	/* add global variables that hold the snapshot of the array */ 
	ast.body = global_variables_ast.body.concat(ast.body)
	
	/* get a list of all variables that this tool can monitor, allow user to select one */ 
	getGlobalVariablesFromCode(ast);

	
	generateCheckboxes(); 

	/* recursively walk the ast, modifying it where necessary. This is where the code is analysed and necessary code is added in  */ 
	r_walk(ast);

	/* generate a javascript program from the ast */ 
	var modified_program = astring.generate(ast) ; 
	console.log("Internally Generated Code:"); 
	console.log(modified_program); 
	
	/* run the simulation */ 
	eval(modified_program);

	
	/* show the simulation */ 
	showVisualization(); 
	
} 	

function getVariablesToMonitor()
{
	let checkboxes = document.getElementsByClassName("vchk"); 
	console.log(checkboxes)
	for(i in checkboxes)
	{
		if(checkboxes[i].checked)
		{
			to_monitor.push(checkboxes[i].getAttribute("variable"))
		}
	}

}


function  getGlobalVariablesFromCode(node)
{
	

	if(node.type == "Program")
	{
		user_entered_variables  = [] ; 		
		getGlobalVariablesFromCode(node.body); 
		
	}
	else
	{
		for (i in node)
		{
			switch(node[i].type)
			{
				case "WhileStatement":
					getGlobalVariablesFromCode(node[i])
				break; 
				case "BlockStatement":
					getGlobalVariablesFromCode(node[i].body)
				break ; 
				case "VariableDeclaration": 
					for (j in node[i].declarations)
						user_entered_variables.push(node[i].declarations[j].id.name); 
				break ; 
			
				
			}// end switch 
		}// end for
	}// end else 
}


/* recursively walk the AST */ 
function r_walk(node, level = 0 )
{
	
	
	if(node.type == "Program")
	{
		r_walk(node.body); 
	}
	else
	{
		for (i in node)
		{
			switch(node[i].type)
			{
			case "WhileStatement":
				/* change the test */ 
				
				let new_test = esprima.parse("(" + astring.generate(node[i].test)+ ") && (internal_continue_execution === true) ").body[0] ; // esprima.parse return aprogram			
				node[i].test = new_test.expression ; 
				
				
				/* walk the statements found in the while block */ 
				for(j in node[i].body.body)
				{
					j = parseInt(j); 
					
					element = node[i].body.body[j]; 
					var statement_operation = getStatementOperation(element) ; 
				
					console.log(statement_operation.type)
					switch(statement_operation.type)
					{
						case "MOVE":
							let action_code = astring.generate(element);  
							let action = "action.code = '"+action_code +"'; action.type = 'move'; action.defined = true ;  action.operation = {from:"+statement_operation.assignment.right_property +" , to : " + statement_operation.assignment.left_property + "};" ;			
							let move_ast = esprima.parse(action); 
								
							node[i].body.body =  node[i].body.body.slice(0 , j).concat(node[i].body.body[j]).concat(move_ast.body.concat(node[i].body.body.slice(j+1))); 
						break ; 
					} 
				}

				
				/* add the end_loop code */ 
				//if(level === 0 )
				//{
					if(node[i].body.type === "BlockStatement")
					{
						// add block level declaration of the move variable 
						let code = "let action = {};"; 
						let code_ast = esprima.parse(code).body; 
						node[i].body.body = code_ast.concat(node[i].body.body); 	

						node[i].body.body = node[i].body.body.concat(end_loop_ast.body)
						//console.log(node[i].body)
					}				
	
				//}
				
				/* recurse -- do it in this order for now to potentiall avoid loops */ 
				r_walk(node[i] , ++level); 
				
				
			break ; 
			case "BlockStatement":
				r_walk(node[i].body, ++level)
				break ; 
			
				
			}
		}
		
	} 
}

/* called when unpause button is clicked */ 
function unPause()
{
	unpause = true ;
	console.log("clicked");  
}

/* Busy wait loop that pauses the code , the sleep is so that the loop doesnt hog the cpu */ 
async function pause()
{
	while(unpause === false)
	{
		await sleep(50); 
	}
	unpause = false ; 
}

/* implement sleep */ 
function sleep(ms) 
{
  return new Promise(resolve => setTimeout(resolve, ms));
}



/**Todo : bracket support **/  
function buildBinaryExpression(expression)
{
	var left , right ; 
	
	/* Recursively get left */ 
	if(expression.left.type === "BinaryExpression")
	{
	
		left = buildBinaryExpression(expression.left) ; 
	}
	else if (expression.left.type === "Identifier" )
	{
		left = expression.left.name ; 
	}
	else if (expression.left.type === "Literal")
	{
		left = expression.left.raw; 

	}	
	
	
	/* Recursively get right */ 
	if(expression.right.type === "BinaryExpression")
	{
		
		right = buildBinaryExpression(expression.right) ; 
	}
	else if(expression.right.type === "Identifier" )
	{
		right = expression.right.name ; 
	}
	else if (expression.right.type === "Literal")
	{
		right = expression.right.raw  ; 

	}	
		
	/* print left + [operator] + right */ 
	let exp = left + expression.operator + right

	return exp ; 

	
}


function getStatementOperation(node)
{
	/* this node is an expression */ 
	if(element.type === "ExpressionStatement")
	{
		if(element.expression.type === "AssignmentExpression") 
		{		

			console.log(element.expression.left.type)
			if(element.expression.left.type === "MemberExpression" && element.expression.right.type === "MemberExpression" && element.expression.left.object.name === array_to_monitor)
			{

				let assignment = getAssignmentParts(element.expression); 
				if(assignment.left_object_name === assignment.right_object_name) // MOVE
				{
					return {type : "MOVE" , assignment: assignment } ; 
				} 
			}
			else if (element.expression.left.type ===  "MemberExpression" && element.expression.right.type === "Identifier" && element.expression.left.object.name === array_to_monitor)
			{
				 if(element.expression.left.property.type === "Identifier"  )
					return {type: "MOVE_IN" , assignment: {from: element.expression.right.name , to: element.expression.left.property.name }} ;
				else if(element.expression.left.property.type === "Literal")
					return {type: "MOVE_IN" , assignment: {from: element.expression.right.name , to: element.expression.left.property.raw }} ;
				else if(element.expression.left.property.type === "BinaryExpression")
					return {type: "MOVE_IN" , assignment: {from: element.expression.right.name , to: buildBinaryExpression(element.expression.left.property) }} ;
			}
			else if(element.expression.left.type === "Idendifier" )
			{

				/* if it constitutes a move from a variable into the array . n.b. still record the variable */ 
				if (element.expression.right.type === "MemberExpression" && element.expression.right.object.name === array_to_monitor )
				{
					 if(element.expression.right.property.type === "Identifier"  )
						return {type: "MOVE_OUT" , assignment: {from: element.expression.left.name , to: element.expression.right.property.name }} ;
					else if(element.expression.right.property.type === "Literal")
						return {type: "MOVE_OUT" , assignment: {from: element.expression.left.name , to: element.expression.right.property.raw }} ;
					else if(element.expression.right.property.type === "BinaryExpression")
						return {type: "MOVE_OUT" , assignment: {from: element.expression.left.name , to: buildBinaryExpression(element.expression.right.property) }} ;
				}
				else /* if it does not constitute a move out , it still is an assignment so get the new value */ 
				{
					console.log("ASSIGNMENT")
				} 
			}	

			 
		}
	}
	else if(element.type === "VariableDeclaration")
	{	

		
		/* check to see if any of the declarations is a move_out of the array  */ 
		for(d in element.declarations) 
		{
			
			if(element.declarations[d].id.type === "Identifier")
			{
				if(element.declarations[d].init.type === "MemberExpression" && element.declarations[d].init.object.name == array_to_monitor )
				{	
					if(element.declarations[d].init.property.type === "BinaryExpression")
					{
						return {type: "MOVE_OUT" ,  assignment: {from : buildBinaryExpression(element.declarations[d].init.property) , to :  element.declarations[d].id.name  }}; 
					}
					else
					{
						return {type: "MOVE_OUT" ,  assignment: {from : element.declarations[d].init.property.name , to :  element.declarations[d].id.name  }}; 
					}
				}
				else if (element.declarations[d].init.type === "BinaryExpression")
				{	
					return {type: "IDENTIFIER_CHANGE" , identifier : element.declarations[d].id.name , change_to : buildBinaryExpression(element.declarations[d].init)}
				}
				else if (element.declarations[d].init.type === "Identifier")
				{
					return {type: "IDENTIFIER_CHANGE" , identifier : element.declarations[d].id.name , change_to : element.declarations[d].init.name}
				}
	
			}
		} 
	}

	return {type: "OTHER"} ; 
					
} 

function determineOperationType(node) 
{
	
	if(node.left.type === "MemberExpression" && node.right.type === "MemberExpression" && node.left.object.name === array_to_monitor) 
	{
		
		let assignment = getAssignmentParts(node); 
		if(assignment.left_object_name === assignment.right_object_name)
		{
	
			return {type : "MOVE" , assignment: assignment } ; 
		}

	}
	else if (node.type === "VariableDeclaration")
	{
		/* check to see if any of the declarations is a move_out of the array  */ 
		for(d in node.declarations) 
		{
			console.log("reached here")
			if(node.declarations[d].init.type === "MemberExpression" && node.declarations[d].init.object.name == array_to_monitor && node.declarations[d].id.type === "Identifier")
				if(node.declarations[d].init.property.type === "BinaryExpression")
					console.log( {type: "MOVE_OUT" ,  assignment: {from : buildBinaryExpression(node.declarations[d].init.property) , to :  node.declarations[d].id.name  }}); 
		}
	}
	else if (node.left.type === "MemberExpression" && node.left.object.name === array_to_monitor )
	{
		return {type: "CHANGE" } ; 
	}
	else 
		return {type : "OTHER"} ; 			
}


function getAssignmentParts(node)
{

	/* get left object name */ 
	let left_object_name = ""; 
	left_object_name = node.left.object.name ; 
		
	/* get the left property type */ 
	let left_property_type = "" ; 
	let left_property = ""; 
	left_property_type = node.left.property.type ; 
		
	
	/* get the right object name */ 
	let right_object_name = "" ; 
	right_object_name = node.right.object.name ; 
		
	
	/* get the right property */ 
	let right_property = ""; 
	let right_property_type = "" ; 
	right_property_type = node.right.property.type ; 
	
	
	
	// if the type of property on the left is
	switch(left_property_type)
	{
		case "Identifier": // an identifier
			left_property = node.left.property.name ; 
			break ; 
 
		case "Literal" : 
			left_property = node.left.property.raw ; 	
			break ; 
		case "BinaryExpression": 
			left_property = buildBinaryExpression(node.left.property ) ;
			break ; 
	}
	

	/* get the right property */ 
	switch(right_property_type)
	{
		case "Identifier": 
			right_property = node.right.property.name ; 
			break ; 
		case "Literal" : 
			right_property = node.right.property.raw ; 
			break ; 
		case "BinaryExpression": 
			right_property = buildBinaryExpression(node.right.property) ; 
			break ; 
	}
	
	return {left_object_name : left_object_name , left_property : left_property , right_object_name : right_object_name , right_property: right_property }; 
}




async function showVisualization()
{

	
	
	var current_code = document.getElementById("current_code"); 
	
	var fontSize = 15; 
	var cellPadding = 8;  	
	var array ; 


	let variable_paths = [] ; 

	for (i in to_monitor)
	{
		variable_paths[i] = new PointText(new Point(50 , (i *20) + 150) ); 
		variable_paths[i].content = ""+to_monitor[i] + " :"; 

	}	
	
	for (var j  = 0 ; j < internal_array_monitor.length ; j++ )
	{
		
		var element = internal_array_monitor[j] ; 

		var children = 
		{
			children : [ ] , 
		}

		/* draw out one row of cells */ 
		let current_length = 0 ; 
		var cell_widths = [] ; 
		for (var i = 0 ; i < element.snapshot.length ; i++) 
		{
			var text ; 
			var cell_width = 30 ; 	
			
			/* if the cell is empty put a dash */
			if(typeof element.snapshot[i] === "undefined" || element.snapshot[i]=== null)
			{
				text = new PointText(new Point(i*22 + 11 , 0 ) ); 
				text.content ="-" ; 
				
			}	
			else
			{
				string = element.snapshot[i].toString() ; // get the contents of the cell 
				if(string.length > 1)
					cell_width = context.measureText(string).width + 3*cellPadding 	;  // measure it 				
				
				/* position it */ 		
				let x = current_length + cellPadding ; 
				let y =40 -  fontSize  ; 
				
				/* set the text */ 
				text = new PointText(new Point(x ,y ))
				text.content = string ; 
				
			}


			text.fillColor = "black" ;
			text.fontSize = fontSize ;
			text.fontFamily = "cFont"; 
			children.children.push(text) ; 

			cell_widths.push(cell_width); 
			if(i === element.snapshot.length-1 )
			{
				children.children.push(makeCell(cell_width).translate(new Point(current_length  ,0) ))
			}
			else 
				children.children.push(makeCell(cell_width , true).translate(new Point(current_length  ,0) ))

			current_length += cell_width + 2  ; 
		}

		/* draw all variables*/
		/* for nnow , just get all the variables in the program */ 
	

		console.log(element ); 
		/* if something is done to this particular array ellemt */ 
		if( element.action.defined )
		{

			/* Display the code , that is being represented ... to the user  */ 
			current_code.innerHTML = element.action.code + "<br> A move within the array"; 


			let to = element.action.operation.to ; // the index of the cell to move to 
			let from = element.action.operation.from; // the origin cell index 
			let element_to_move = children.children.filter(obj => obj.constructor.name === "PointText" )[from]; 
			let reference_element  = children.children.filter(obj => obj.constructor.name === "PointText") [to]; 
	
			element_to_animate = element_to_move ;
	
			/* calculate from_x */ 
			var from_x  = 0 ; 
			var sum_width = 0 ; 
			var i ; 
			for(i = 0 ; i < from ; i++)
			{
				sum_width += cell_widths[i]+2; 
			}
			sum_width += cell_widths[from] / 2  ;
			from_x = sum_width ;   

			/* calculate to_x */ 
			var to_x  = 0 ; 
			sum_width = 0 ; 
			for(i = 0 ; i < to ; i++)
			{
				sum_width += cell_widths[i]+2; 
			}
			sum_width += cell_widths[to] / 2  ;
			to_x = sum_width ;   
			to_x = reference_element.position.x ;
			
			/* translate the elemtnt*/ 
			element_to_animate.animate({
			  properties: {
			    position: {
			      x: to_x, // relative to the current position of the item. At the end, `x` will be : 275 
			      y: "+0"     // absolute position. At the end, `y` will be : 150 
			    },
			 
			  },
			  settings: {
			    duration:300,
			    easing:"easeOut"
			  }
			});
			

			/* fade the element */ 
			reference_element.animate({
			  properties: {
			    opacity: 0, 
			 
			  },
			  settings: {
			    duration:300,
			    easing:"easeIn"
			  }
			});
		}
		else current_code.innerHTML = "" ; 
		
		
		if(array)
			array.remove(); 


		array = new CompoundPath( children);
			
	//	array.strokeColor = "#b82d88" ; 
		array.strokeColor = "#ffffff" ;		
		array.strokeWidth = 1.5 ;
		array.miterLimit= 1 ; 

		array.translate(new Point(50 , 200  ))

		 		
		await sleep(800);
			
	}
	
	
	view.draw(); 		

}

function frame()
{
	console.log(element_to_animate)
	if(element_to_animate)
	element_to_animate.translate(new Point(2, 0)) ; 
}


function makeCell(width=20 ,  closed=false )
{                                                        
	var cell = new Path(); 
	cell.add(new Point(0.5, 0.5 ));
	cell.add(new Point(0.5 , 40.5)); 
	cell.add(new Point(width+0.5 , 40+0.5));	

	/* the last box in an array representation */ 
	var end_cell = cell.clone(); 
	end_cell.add(new Point(width+0.5, 0.5)); 

	return (closed) ? cell : end_cell ; 
	
}


function generateAst()
{
	var end_loop_code = "let to_be_added = {snapshot: array.slice(0), action : action}	; \n\
if(to_be_added.snapshot.length > 10)\n\
{\n\
	internal_continue_execution = false ;\n\
console.log('This loop is being executed too many times, the array is too large')\n\
}\n\
else\n\
	internal_array_monitor.push(to_be_added);" ; 	

end_loop_ast = esprima.parse(end_loop_code); 

global_variables_ast = esprima.parse("internal_continue_execution = true ;internal_array_monitor = [];"); 
}









