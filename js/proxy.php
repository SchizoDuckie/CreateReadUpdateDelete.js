<?php

global $_TPL, $_URI;
function kill($msg='') {
	header('HTTP/1.1 500 Internal Server Error');
	print_r(debug_backtrace());
	die($msg);
}

switch(strtolower($_URI[0])) {
	case 'dbobject':
		switch($_URI[1]) {
			case 'proxy':
				switch($_URI[2]) {
					case 'delete':
						if(!isset($_POST['ID']) || !is_numeric($_POST['ID']) || !isset($_POST['oldData']) || isset($_POST['newData'])) {
							kill();
						}
						switch($_POST['what']) {	
							case 'Producttype':
								if($_POST['ID'] != 'false' && !isset($_POST['newData']) && isset($_POST['oldData']['ProductName'])) {
										
									$prod = $_SESSION['user']->getProductType($_POST['ID']);
									if(!$prod) kill();

									foreach($_POST['oldData'] as $key=>$val) {
										if(!isset($prod->databaseValues[$key]) || $prod->databaseValues[$key] != $val) kill();
									}
									$prod->DeleteYourself();

									$output = json_encode(Array("What"=> $_POST['what'], "ID"=> $_POST['ID'], "length" => 1, "Action"=> "deleted", "Result"=> array(false)));
									header('Content-Type: application/json');
									header('Content-Encoding: UTF-8');
									header("Content-Length: ".strlen($output));
									die($output);
								}
							break;
						}
					break;
					case 'save':
						$result = array();
						$output = array();

						if( !isset($_POST['what']) || !isset($_POST['ID']) ||
							($_POST['ID'] == 'false' && (!isset($_POST['newData']) && !isset($_POST['customData']))) ||
							(is_numeric($_POST['ID']) && (!isset($_POST['oldData']) ||
							(!isset($_POST['newData']) && !isset($_POST['customData']) )))
							) {
							kill();
						}
						switch($_POST['what']) {
							case 'Category':
								// todo:secure!
								    unset($_POST['newData']['ID_Category']);		
									if(is_numeric($_POST['ID'])) {
										$cat = dbObject::Search("Category", array("ID"=>$_POST['ID'], "Catalog"=> Array("ID_Client" => $_SESSION['clientId'])));
										if(!$cat) kill();
										$cat = $cat[0];
									} else {
										$cat= new Category();
										$cat->ID_Client = $_SESSION['clientId'];
																		
									}
									foreach($_POST['newData'] as $key=>$val) {
										$cat->$key = $val;
									}	

									$cat->Save();

									$output = json_encode(Array("What"=> $_POST['what'],"length" => 1, "Action"=> is_numeric($_POST['ID']) ? 'updated' :'inserted', "Result"=> array($cat->databaseValues)));
								header('Content-Type: application/json');
								header('Content-Encoding: UTF-8');
								header("Content-Length: ".strlen($output));
								die($output);

							break;
							case 'Productproperty':
								// todo:secure!
									if(is_numeric($_POST['ID'])) {
										$prods = dbObject::Search("Productproperty", array("ID"=>$_POST['ID'], "ID_Client" => $_SESSION['clientId']));
										if(!$prods) kill();
										$prod = $prods[0];
									} else {
										$prod = new ProductProperty();
										$prod->ID_Client = $_SESSION['clientId'];
									}
									foreach($_POST['newData'] as $key=>$val) {
										$prod->$key = $val;
									}	

									$prod->Save();

									$output = json_encode(Array("What"=> $_POST['what'],"length" => 1, "Action"=> is_numeric($_POST['ID']) ? 'updated' :'inserted', "Result"=> array($prod->databaseValues)));
								header('Content-Type: application/json');
								header('Content-Encoding: UTF-8');
								header("Content-Length: ".strlen($output));
								die($output);
							
							break;
							case 'Producttype':

								if($_POST['ID'] == 'false' && isset($_POST['newData']['ProductName'])) {
									$prod = new Producttype();
									$prod->productname = strip_tags($_POST['newData']['ProductName']);
									$prod->enabled = 1;
									$prod->ID_Client = $_SESSION['clientId'];
									$prod->Save();
								
									$output = json_encode(Array("What"=> $_POST['what'],"length" => 1, "Action"=> "inserted", "Result"=> array($prod->databaseValues)));

								} elseif(is_numeric($_POST['ID']) && isset($_POST['newData']) && isset($_POST['newData']['ProductName'])) {
									$prod = $_SESSION['user']->getProducttype($_POST['ID']);

									foreach($_POST['oldData'] as $key=>$val) {
										if(!isset($prod->databaseValues[$key]) || $prod->databaseValues[$key] != $val) kill();
									}

									foreach($_POST['newData'] as $key=>$val) {
										if(!$prod->hasProperty($key)) kill();
										$prod->$key = $val;
									}
									$prod->Save();

									$output = json_encode(Array("What"=> $_POST['what'],"length" => 1, "Action"=> "saved", "Result"=> array($prod->databaseValues)));
								}
								header('Content-Type: application/json');
								header('Content-Encoding: UTF-8');
								header("Content-Length: ".strlen($output));
								die($output);
							
							break;
							case 'Slide':
								
								if(is_numeric($_POST['ID']) && isset($_POST['newData']))
								{
									$slide = new Slide($_POST['ID']);
									if(!$slide->isOwner()) kill();

									foreach($_POST['oldData'] as $key=>$val) {
										if(!isset($slide->databaseValues[$key]) || $slide->databaseValues[$key] != $val) kill();
									}

									foreach($_POST['newData'] as $key=>$val) {
										if(!$slide->hasProperty($key)) kill();
										$slide->$key = $val;
									}

									$slide->Save();

									$output = json_encode(Array("What"=> $_POST['what'],"length" => 1, "Action"=> "saved", "Result"=> array($slide->databaseValues)));
								}
								header('Content-Type: application/json');
								header('Content-Encoding: UTF-8');
								header("Content-Length: ".strlen($output));
								die($output);

							break;
							case 'Product':
								if($_POST['ID'] == 'false' && isset($_POST['customData']) && isset($_POST['customData']['ID_Category'])) {
									$prod = new Product();

									foreach($_POST['newData'] as $key=>$val) {
										if($prod->hasProperty($key)) $prod->$key = $val;
									}

									$prod->Save();

									$cp = new CategoryProduct();
									$cp->ID_Product = $prod->ID;
									$cp->ID_Category = $_POST['customData']['ID_Category'];
									$cp->enabled = 1;
									$cp->Save();

									$result = array($prod->databaseValues);
									$output = json_encode(Array("What"=> $_POST['what'],"length" =>1, "Action"=> "inserted", "Result"=> $result));
									header('Content-Type: application/json');
									header('Content-Encoding: UTF-8');
									header("Content-Length: ".strlen($output));
									die($output);
								}
								$prod = $_SESSION['user']->getProduct($_POST['ID']);
								if(!$prod) kill("product not found for user");
								
								foreach($_POST['oldData'] as $key=>$val) {
									//if(!isset($prod->databaseValues[$key]) || $prod->databaseValues[$key] != $val) kill($key.'-'.$val.'-'.$prod->databaseValues[$key]);
								}
							
									
								if(isset($_POST['customData'])) {	
									$properties = array();
									$values= array();

									$type = $prod->Find("Producttype");
									if($type) {
										$props = $type[0]->Find("Productproperty");
										foreach($props as $prop) {
											$properties[$prop->ID] = $prop;
										}
									}
									$val = $prod->find("Productvalue");

									if($val) {
										foreach($val as $value) {
											$values[$value->ID] = $value;	
										}
									}
										
									foreach($_POST['customData'] as $key=>$customvalue) {
										if(!$properties) kill("No custom properties found");

										parse_str(str_replace(Array('|',':'), Array('&','='), $key), $parms);
										if(isset($parms['prop']) && isset($parms['prod']) && isset($parms['val'])) {
											if(array_key_exists($parms['prop'], $properties)) {
												if($parms['val'] == 'new') {
													$sneakyexists = dbObject::Search("Productvalue", array("ID_Client"=>$_SESSION['ID_Client'], "ID_Product"=>$parms['prod'], "ID_ProductProperty"=>$parms['prop']));
													if(!$sneakyexists) {
														$prodval = new ProductValue();
													} else {
														$prodval = $sneakyexists[0];
														echo("exists!");
													}	
													$prodval->ID_Client = $_SESSION['clientId'];
													$prodval->ID_Product = $_POST['ID'];
													$prodval->ID_ProductProperty = $parms['prop'];
													$prodval->Value = $customvalue;
													$prodval->Save();
													$output[] = $prodval->databaseValues;
												} elseif(isset($values[$parms['val']])) {
													$prodval = $values[$parms['val']];
													if($prodval->Value != $customvalue) {
														$prodval->Value = $customvalue;
														$prodval->Save();
														$output[] = $prodval->databaseValues;
													}
												} else {
													kill("unknown property");
												}
											}
										}
									}
								}
								if(!empty($_POST['newData'])) {
									foreach($_POST['newData'] as $key=>$val) {
										if(!$prod->hasProperty($key)) kill();
										$prod->$key = $val;
									}
									$prod->Save();
								}
							break;
							default: 
								kill();
							break;
						}	
						$result = sizeof($output) > 0 ? array($prod->databaseValues, 'productvalues' => $output) :  array($prod->databaseValues);
						$output = json_encode(Array("What"=> $_POST['what'],"length" => sizeof($result), "Action"=> "updated", "Result"=> $result));
						header('Content-Type: application/json');
						header('Content-Encoding: UTF-8');
						header("Content-Length: ".strlen($output));
						die($output);
					break;
					default:
						$result = array();
						switch($_POST['what']) {
							case 'Category':
								$results = dbObject::Search($_POST['what'], $_POST['filters']);
								if($results) {
									foreach($results as $object) {
										$result[] = $object->databaseValues;				
									}
								}
								$what = $_POST['what'];
							break;
							case 'SBImage':
								$_POST['what'] = 'Image';
								$results = dbObject::Search($_POST['what'], $_POST['filters']);
								if($results) {
									foreach($results as $object) {
										$result[] = $object->databaseValues;				
									}
								}
								$what = 'SBImage';
							break;
							case 'Slide':
								$_POST['filters']['Presentation']['ID_Client'] = $_SESSION['clientId'];
								$results = dbObject::Search($_POST['what'], $_POST['filters']);
								if($results) {
									foreach($results as $object) {
										$result[] = $object->databaseValues;				
									}
								}
								$what = $_POST['what'];
							break;
							case 'Producttype':
							case 'Productproperty':
							case 'Presentation':
							case 'Image':
								
								$_POST['filters']['ID_Client'] = $_SESSION['clientId'];
								$results = dbObject::Search($_POST['what'], $_POST['filters']);
								if($results) {
									foreach($results as $object) {
										$result[] = $object->databaseValues;				
									}
								}
								$what = $_POST['what'];
							break;
							case 'Product':

								$results = dbObject::Search($_POST['what'], $_POST['filters']);
								if($results) {
									foreach($results as $object) {
										$result[] = $object->databaseValues;				
									}
								}
								$what = $_POST['what'];


							break;
							case 'RelatedProduct':
								$results = dbObject::Search($_POST['what'], $_POST['filters']);
								if($results) {
									foreach($results as $object) {
										$p = new Product($object->ID_RelatedProduct);
										$result[] = $p->databaseValues;
									}
								}
								$what = 'Product';
							break;

						}	
						$output = json_encode(Array("What"=> $what,"length" => sizeof($result), "Result"=> $result));
						header('Content-Type: application/json');
						header('Content-Encoding: UTF-8');
						header("Content-Length: ".strlen($output));
						die($output);
					break;
			}
			break;
	}
	break;
}