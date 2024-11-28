import { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const defaultTreeNodes = [
  {
    nodeId: "1",
    parentNodeId: null,
    title: "Root Node",
    color: "red",
  },
  {
    nodeId: "2",
    parentNodeId: "1",
    title: "Child Node 1",
    color: "blue",
  },
  {
    nodeId: "3",
    parentNodeId: "1",
    title: "Child Node 2",
    color: "green",
  },
  {
    nodeId: "4",
    parentNodeId: "2",
    title: "Grandchild Node 1",
    color: "yellow",
  },
  {
    nodeId: "5",
    parentNodeId: "3",
    title: "Grandchild Node 2",
    color: "purple",
  },
];

type FlatTreeNode = (typeof defaultTreeNodes)[number];

type TreeNode = {
  nodeId: string;
  color: string;
  children?: TreeNode[];
};

function treeNodesToTree(treeNodes: FlatTreeNode[]) {
  const tree: TreeNode[] = [];
  const nodeMap = new Map(treeNodes.map((node) => [node.nodeId, node]));

  for (const node of treeNodes) {
    if (node.parentNodeId === null) {
      tree.push(node);
    } else {
      const parentNode = nodeMap.get(node.parentNodeId) as TreeNode;

      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = [];
        }

        parentNode.children.push(node);
      }
    }
  }

  return tree;
}

function findParentNodeByChildId(
  node: TreeNode,
  nodeId: string
): TreeNode | null {
  if (node.children) {
    for (const child of node.children) {
      if (child.nodeId === nodeId) {
        return node;
      }

      const parentNode = findParentNodeByChildId(child, nodeId);

      if (parentNode) {
        return parentNode;
      }
    }
  }

  return null;
}

function findNodeById(node: TreeNode, nodeId: string): TreeNode | null {
  if (node.nodeId === nodeId) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const foundNode = findNodeById(child, nodeId);

      if (foundNode) {
        return foundNode;
      }
    }
  }

  return null;
}

function changeParentNode(
  node: TreeNode,
  nodeId: string,
  newParentNodeId: string
) {
  const oldParentNode = findParentNodeByChildId(node, nodeId);
  const oldNode = oldParentNode?.children?.find(
    (child) => child.nodeId === nodeId
  );

  if (oldNode && oldParentNode) {
    oldParentNode.children = oldParentNode.children?.filter(
      (child) => child.nodeId !== nodeId
    );

    const newParentNode = findNodeById(node, newParentNodeId);

    if (newParentNode) {
      if (!newParentNode.children) {
        newParentNode.children = [];
      }

      newParentNode.children.push(oldNode);
    }
  }

  return node;
}

const defaultTree = treeNodesToTree(defaultTreeNodes);

enum ItemTypes {
  NODE = "NODE",
}

type DropItemType = {
  id: string;
  type: string;
};

type TreeProps = {
  node: TreeNode;
  onDrop: (item: DropItemType, targetParentId: string) => void;
};

function Tree({ node, onDrop }: TreeProps) {
  const [, dragRef] = useDrag(
    () => ({
      type: ItemTypes.NODE,
      item: { id: node.nodeId, type: ItemTypes.NODE },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    []
  );

  const [, dropRef] = useDrop(() => ({
    accept: ItemTypes.NODE,
    drop: (item: DropItemType, monitor) => {
      if (!monitor.didDrop()) {
        //  ? Only handle the event if this is the final target
        onDrop?.(item, node.nodeId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div ref={dragRef}>
      <div
        ref={dropRef}
        style={{
          paddingLeft: "2rem",
        }}
      >
        <div
          style={{
            padding: "1.5rem",
            border: "1px solid gray",
            borderColor: node.color,
          }}
        >
          {`Node #${node.nodeId}`}
        </div>
        {node.children?.map((node) => (
          <Tree key={node.nodeId} node={node} onDrop={onDrop} />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [rootNode, setRootNode] = useState<TreeNode>(defaultTree[0]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Tree
        node={rootNode}
        onDrop={(item, targetParentId) => {
          setRootNode((prevRootNode) => {
            return {
              ...changeParentNode(prevRootNode, item.id, targetParentId),
            };
          });
        }}
      />
    </DndProvider>
  );
}

export default App;
