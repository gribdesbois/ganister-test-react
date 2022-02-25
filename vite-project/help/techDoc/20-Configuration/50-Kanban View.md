# KanBan View Tab Configuration

![1563880123098](assets\1563880123098.png)

**KanBan View Tab  (KANBAN)** is used to organized your nodes in column style. Each node can have multiple KANBAN tabs for one or more relationships.

### Lists

Lists is a comma separated string. *(e.g. "list 1,list 2,list 3")*



### How to configure a Kanban View Tab

In the example configuration below we will configure a KANBAN tab for myNodeToAnotherNode illustrated below:

![1563868668444](assets%5C1563868668444.png)



Follow the below steps to configure a KANBAN:

1. Create a new property of type “string” on mynode. The name of the property can be anything, in our example we call it “**_kanbanList1**”!  (this property will save the lists  for each tab).

   ![image-20200130145359936](assets\image-20200130145359936.png)

2. Create a new tab on mynode. This tab must have the Content Type as “**kanbanView**” and then below we select the relationship “**myNodeToAnotherNode**” and Property “**_kanbanList1**” (the new property we just created). In the **Kanban Card Design** below you can specify your own card design. Below is an example for the assignment nodetype. You can use the node variable to inject node's properties into the design like {{node.name}}.
   Don't forget to click update KanBan Card button to save the design!

```http
<div class="row">
  <div class="col-xs-12">
      <h4 style="font-weight: 600">{{node.name}}<a href="#" class="close" aria-label="close" ng-click="updateKanbanValue(node,'')">&times;</a>
      </h4>
  </div>
</div>
<div class="row">
  	<div class="col-xs-12">
    	Assignment Completed: {{node.progress}}%
	</div>
    <div class="col-xs-12">
      	<div class="progress">
            <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar"
        aria-valuenow="{{node.progress}}" aria-valuemin="0" aria-valuemax="100" ng-style="{ 'width' : node.progress + '%' }">
            </div>
    	</div>
    </div>
</div>
<div class="row">
    <div class="col-xs-12 col-md-12">
    	Due Date: {{node.dueDate}}
    </div>
</div>
```

![image-20200130145504366](assets\image-20200130145504366.png)



3.  Create a new property on the relationship “**myNodeToAnotherNode**” of type string. The name of the property must match the property name in mynode, in our example we name it “**_kanbanList1**”! (this property will save the column on  **myNodeToAnotherNode** relationship). 



### How to create lists

To create a List follow steps below:

1. Click on the button shown on screenshot below
   ***Do not forget to save the lists afterwards!***


   ![image-20200130145605222](assets\image-20200130145605222.png)







