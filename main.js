

paper.install(window);
window.addEventListener("load" , onWindowLoad); 

array_to_monitor = "array"; 

var element_to_animate;
var element_to_animate_from ; 
var element_to_animate_to;  

var user_entered_variables = [];

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
	var editor = ace.edit("editor");
    	editor.setTheme("ace/theme/custom");
	editor.setOptions({showPrintMargin :false , highlightActiveLine  : false}) ;
    	editor.session.setMode("ace/mode/javascript");

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
	program = "var array = [54, 26, 93, 17, 77, 31,  44, 55] ;var i = 0, j= 0 ; while( i  < array.length) { let value = array[i]; var j = i -1 ; while (j > -1 && array[j] > value){ array[j + 1] = array[j] ;   j-- ; }  array[j + 1]= value ; i++ ; }  "; 


	// remove this 
	program = astring.generate(esprima.parse(program))
	editor.setValue(program); 
}


function runSimulaton()
{	
	/* generate abstract syntax tree */ 
	ast = esprima.parse(program, {loc: true}); 
	
	/* add global variables that hold the snapshot of the array */ 
	ast.body = global_variables_ast.body.concat(ast.body)
	
	/* get a list of all variables that this tool can monitor, allow user to select one */ 
	getGlobalVariablesFromCode(ast);

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



function  getGlobalVariablesFromCode(node)
{
	if(node.type == "Program")
	{
		 getGlobalVariablesFromCode(ast.body); 
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
				
				
				/* look for assignments (computed member expression) */
				for(j in node[i].body.body)
				{
					j = parseInt(j); 
					
					element = node[i].body.body[j]; 
							
					if(element.type === "ExpressionStatement")
					{
						if(element.expression.type === "AssignmentExpression" )
						{
							operation = determineOperationType(element.expression);
							if(operation.type === "MOVE")
							{
								let action_code = astring.generate(element);  
								let action = "action.code = '"+action_code +"'; action.type = 'move'; action.defined = true ;  action.operation = {from:"+operation.assignment.right_property +" , to : " + operation.assignment.left_property + "};" ;			console.log(astring.generate(element))
								console.log(element)
								let move_ast = esprima.parse(action); 
								
								node[i].body.body =  node[i].body.body.slice(0 , j).concat(node[i].body.body[j]).concat(move_ast.body.concat(node[i].body.body.slice(j+1))); 
							}
						}
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
	
	
	var fontSize = 15; 
	var cellPadding = 8;  	
	var array ; 
	
	
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
			
			if(typeof element.snapshot[i] === "undefined" || element.snapshot[i]=== null)
			{
				text = new PointText(new Point(i*22 + 11 , 0 ) ); 
				
			}	
			else
			{
				string = element.snapshot[i].toString() ;
				if(string.length > 1)
					cell_width = context.measureText(string).width + 3*cellPadding 	; 				
		
				let x = current_length + cellPadding ; 
				let y =40 -  fontSize  ; 
				
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

		var element = (j === internal_array_monitor.length) ?  internal_array_monitor[j+1] :   internal_array_monitor[j] ; 
		
		if( element.action.defined )
		{

			var to = element.action.operation.to ; 
			var from = element.action.operation.from	 ; 
			element_to_move = children.children.filter(obj => obj.constructor.name === "PointText" )[from]; 
			reference_element  = children.children.filter(obj => obj.constructor.name === "PointText") [to]; 
	
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
			
			/* translate the elemtnt */ 
			element_to_animate.animate({
			  properties: {
			    position: {
			      x: to_x, // relative to the current position of the item. At the end, `x` will be : 275 
			      y: "+0"     // absolute position. At the end, `y` will be : 150 
			    },
			 
			  },
			  settings: {
			    duration:400,
			    easing:"easeIn"
			  }
			});

			/* fade the element */ 
			reference_element.animate({
			  properties: {
			    opacity: 0, 
			 
			  },
			  settings: {
			    duration:400,
			    easing:"easeIn"
			  }
			});
			
		
		
			/* draw arrow */ 
			var arrow = new Path(); 
			arrow.add(new Point(from_x , j*30-1)); 
			arrow.add(new Point(to_x, j*30-1)) ; 
			arrow.add(new Point(to_x - 5 , j*30-5)) 
			//arrow.strokeColor = "green"
		
		
		
	
		}
		
		
		if(array)
			array.remove(); 


		array = new CompoundPath( children);
			
		array.strokeColor = "#b82d88" ; 
		array.strokeWidth = 1.5 ;
		array.miterLimit= 1 ; 

		array.translate(new Point(10 , 100  ))

		 		
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









