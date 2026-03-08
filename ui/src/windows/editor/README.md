# Editor

Represents the main editor that is shown fluf is opened - editor contains all the features for code edit's to work

# Styles

- Prefix each component with editor-
- Use default angular components for each UI element instead of making our own
- Each component css styles prefixed with it's name or part of the name like editor*frame*
- Use either public or private - if the variable is never read in UI or should not then use `private` else make it public and assume it can be used in UI
- Use angular `@` syntax for UI templates
- use pascal case
- Use signals for ever field that is read into UI saves render cycles

Understand flex - we use flex for layout and filling so to get overflow properly working first:
- Parent must have display flex, min height, min width all the way up from it self to root body tag which has the same
- Component render with extra angular html element like `<angular_html_tag>actual html of component<angular_html_tag>` so inside of the component
  add `:host {display:flex; min-height:0; min-width:0;}` so overflow works properly, whenever you get broken over flow it is becuase this rule has been broken in the chain of HTML 
  heirarchy use dev tools to find the tag and apply said styles all the way down
