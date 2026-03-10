import ast
import re
import asttokens

class Skeletonizer:
    @staticmethod
    def parse_patch(patch_str: str) -> set[int]:
        """
        Extracts all line numbers that were modified (added or changed) from a unified diff patch.
        Uses the start line and length of the + side of the hunk header.
        Returns a set of 1-indexed line numbers.
        """
        modified_lines = set()
        if not patch_str:
            return modified_lines

        # Regex to match hunk headers like @@ -15,7 +18,9 @@ or @@ -15 +18 @@
        hunk_header_re = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")
        
        for line in patch_str.split("\n"):
            header_match = hunk_header_re.match(line)
            if header_match:
                start_line = int(header_match.group(1))
                # Diff hunks can omit length if length is 1
                length_str = header_match.group(2)
                length = int(length_str) if length_str else 1
                
                # Add all lines in the modified range
                modified_lines.update(range(start_line, start_line + length))

        return modified_lines

    @staticmethod
    def skeletonize(file_content: str, patch_str: str) -> str:
        """
        Parses the python file content into an AST using asttokens.
        Identifies and preserves all imports.
        Identifies all classes and functions. If they intersect with patch lines, they are kept whole.
        If they do not, they are reduced to their signature/docstring and a `... # unchanged` marker.
        Returns rebuilt string via line-slicing.
        """
        modified_lines = Skeletonizer.parse_patch(patch_str)
        if not modified_lines:
            return file_content
            
        try:
            atok = asttokens.ASTTokens(file_content, parse=True)
            tree = atok.tree
        except SyntaxError:
            return file_content

        # Nodes to preserve exactly as they are without truncation
        keep_nodes = []
        # Nodes we will truncate
        skeletonize_nodes = []

        class ScopeVisitor(ast.NodeVisitor):
            def visit_Import(self, node):
                keep_nodes.append(node)
                self.generic_visit(node)

            def visit_ImportFrom(self, node):
                keep_nodes.append(node)
                self.generic_visit(node)

            def visit_FunctionDef(self, node):
                # Using asttokens bounds, which handle decorators accurately
                (start, end) = atok.get_text_positions(node, padded=False)
                start_line = start[0]
                end_line = end[0]
                
                # O(1) boundary check optimization
                if modified_lines:
                    mod_min = min(modified_lines)
                    mod_max = max(modified_lines)
                    has_overlap = not (end_line < mod_min or start_line > mod_max)
                else:
                    has_overlap = False
                
                if has_overlap:
                    keep_nodes.append(node)
                else:
                    skeletonize_nodes.append(node)
                # DO NOT visit children! We don't want to process nested functions 
                # inside a truncated parent.

            def visit_AsyncFunctionDef(self, node):
                self.visit_FunctionDef(node)
                
            def visit_ClassDef(self, node):
                # We always "visit" classes so we can parse their child methods.
                # The class signature itself is not automatically preserved unless we build logic for it,
                # but we'll use a trick: If we keep/skeletonize its children, the class signature 
                # naturally remains as context padding.
                self.generic_visit(node)

        visitor = ScopeVisitor()
        visitor.visit(tree)

        # Build output string line by line
        original_lines = file_content.splitlines()
        output_lines = []
        
        # We process line by line, but if we hit a skeletonized function, we skip to its end.
        skip_to_line = -1
        
        node_map = {}
        for n in keep_nodes:
            (start, _) = atok.get_text_positions(n, padded=False)
            node_map[start[0]] = {"type": "keep", "node": n}
            
        for n in skeletonize_nodes:
            (start, _) = atok.get_text_positions(n, padded=False)
            node_map[start[0]] = {"type": "skeleton", "node": n}
            
        for i in range(1, len(original_lines) + 1):
            if skip_to_line != -1 and i <= skip_to_line:
                continue

            # Check if a mapped node starts exactly on this line
            if i in node_map:
                marker = node_map[i]
                node = marker["node"]
                (start, end) = atok.get_text_positions(node, padded=False)
                start_line = start[0]
                end_line = end[0]
                
                if marker["type"] == "keep":
                    # Let the normal loop copy it, we just don't skip
                    pass
                elif marker["type"] == "skeleton":
                    # Determine where the body starts
                    if not getattr(node, "body", None):
                        # Edge case: empty body or ast issue, just copy the whole thing
                        skip_to_line = -1
                        pass
                    else:
                        body_start = atok.get_text_positions(node.body[0], padded=False)[0]
                        body_start_line = body_start[0]
                        
                        # Copy from signature up to before the body
                        for sig_line_idx in range(start_line, body_start_line):
                            # Ensure we don't crash on empty index
                            if sig_line_idx - 1 < len(original_lines):
                                output_lines.append(original_lines[sig_line_idx - 1])
                        
                        # Extract the exact indent of the first body line to align our comment
                        if body_start_line - 1 < len(original_lines):
                            body_line = original_lines[body_start_line - 1]
                            indent = len(body_line) - len(body_line.lstrip())
                            spaces = " " * indent
                        else:
                            spaces = "    "
                            
                        output_lines.append(f"{spaces}...  # unchanged")
                        
                        # Skip the rest of this node
                        skip_to_line = end_line
                        continue
                    
            output_lines.append(original_lines[i - 1])

        return "\n".join(output_lines)
