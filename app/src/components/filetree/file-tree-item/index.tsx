import { FileTreeItemProps } from "..";
import { FileItem } from "../file-item";
import { FolderItem } from "../folder-item";

export const FileTreeItem = (props: FileTreeItemProps & { depth?: number }) => {
  const depth = props.depth ?? 0;
  return props.item.type === "folder"
    ? <FolderItem {...props} depth={depth} />
    : <FileItem  {...props} depth={depth} />;
};