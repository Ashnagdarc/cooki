# 🚀 COOKI Development Guide

## Getting Started

### Prerequisites

- Python 3.x (for local development server)
- Modern web browser
- Code editor (VS Code, Sublime Text, etc.)

### Quick Start

1. Clone or download the project
2. Navigate to the project directory
3. Start the development server:

   ```bash
   npm start
   # or
   python3 -m http.server 8000
   ```

4. Open your browser and go to `http://localhost:8000`

## Project Structure

```
cooki/
├── index.html              # Main recipe search page
├── meal-planner.html       # Meal planning interface
├── shopping-list.html      # Shopping list management
├── style.css              # Main stylesheet
├── main.js                # Recipe search functionality
├── meal-planner.js        # Meal planner logic
├── shopping-list.js       # Shopping list functionality
├── package.json           # Project configuration
├── README.md              # Project documentation
└── DEVELOPMENT.md         # This file
```

## Key Features Implemented

### 🍽️ Recipe Discovery

- **Search Functionality**: Search recipes by name, ingredients, or cuisine
- **Recipe Details**: View comprehensive recipe information
- **Modal Interface**: Beautiful recipe detail modals
- **API Integration**: Uses TheMealDB API for recipe data

### 📅 Meal Planner

- **Weekly Calendar**: Visual weekly meal planning
- **Drag & Drop**: Move meals between days and meal types
- **Week Navigation**: Navigate between weeks
- **Quick Add**: Search and add recipes directly to meal plan
- **Local Storage**: Persists meal plans between sessions

### 🛒 Shopping List

- **Automatic Generation**: Creates lists from meal plans
- **Smart Categorization**: Organizes by Produce, Protein, Dairy, etc.
- **Quantity Tracking**: Shows required quantities
- **Cost Estimation**: Provides estimated shopping costs
- **Print Functionality**: Print-friendly shopping lists
- **Check-off System**: Mark items as completed

## Development Workflow

### Adding New Features

1. **Plan the Feature**: Define requirements and user stories
2. **Create Components**: Add HTML structure if needed
3. **Style Components**: Add CSS styles following the design system
4. **Implement Logic**: Add JavaScript functionality
5. **Test**: Test across different devices and browsers
6. **Document**: Update documentation

### Code Style Guidelines

#### HTML

- Use semantic HTML5 elements
- Include proper accessibility attributes
- Maintain clean, organized markup

#### CSS

- Follow the established design system
- Use CSS custom properties (variables)
- Mobile-first responsive design
- Consistent spacing and typography

#### JavaScript

- Use modern ES6+ syntax
- Implement proper error handling
- Follow modular architecture
- Add meaningful comments

## Design System

### Color Palette

- **Primary**: `#ff6b35` (Vibrant Orange)
- **Secondary**: `#f7931e` (Warm Orange)
- **Accent**: `#ffd23f` (Golden Yellow)
- **Success**: `#06d6a0` (Green)
- **Error**: `#ef476f` (Red)
- **Neutral**: Gray scale from 50-900

### Typography

- **Font Family**: Inter (Google Fonts)
- **Font Sizes**: Responsive scale from 0.75rem to 3rem
- **Line Heights**: Optimized for readability

### Spacing

- **Grid System**: 8-point grid system
- **Border Radius**: Rounded corners for modern feel
- **Shadows**: Subtle depth with CSS custom properties

## API Integration

### TheMealDB API

The application uses TheMealDB API for recipe data:

- **Base URL**: `https://www.themealdb.com/api/json/v1/1/`
- **Endpoints Used**:
  - Search: `search.php?s={query}`
  - Recipe Details: `lookup.php?i={id}`
  - Categories: `categories.php`

### Local Storage

- **mealPlan**: Stores user's meal plans
- **shoppingList**: Stores generated shopping lists
- **userPreferences**: Future use for user settings

## Testing

### Manual Testing Checklist

- [ ] Recipe search functionality
- [ ] Recipe detail modal
- [ ] Meal planner drag & drop
- [ ] Week navigation
- [ ] Shopping list generation
- [ ] Shopping list check-off
- [ ] Print functionality
- [ ] Responsive design
- [ ] Accessibility features

### Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

### Current Optimizations

- Debounced search functionality
- Optimized images with proper sizing
- Efficient DOM manipulation
- Local storage for offline functionality
- Minimal external dependencies

### Future Optimizations

- Image lazy loading
- Service worker for offline support
- Code splitting for larger applications
- CDN for external resources

## Deployment

### Static Hosting

The application can be deployed to any static hosting service:

- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Firebase Hosting

### Build Process

Currently, no build process is needed as it's a static HTML/CSS/JS application.

## Contributing

### Development Process

1. Create a feature branch
2. Implement your changes
3. Test thoroughly
4. Update documentation
5. Submit a pull request

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Functionality works as expected
- [ ] Responsive design maintained
- [ ] Accessibility features included
- [ ] Documentation updated

## Troubleshooting

### Common Issues

#### Recipe Search Not Working

- Check internet connection
- Verify TheMealDB API is accessible
- Check browser console for errors

#### Meal Plan Not Saving

- Check browser localStorage support
- Verify JavaScript is enabled
- Check for console errors

#### Shopping List Not Generating

- Ensure meals are added to meal plan
- Check browser console for errors
- Verify localStorage permissions

### Debug Tools

- Browser Developer Tools
- Console logging
- Network tab for API calls
- Application tab for localStorage

## Future Enhancements

### Planned Features

- [ ] User accounts and authentication
- [ ] Recipe favorites and collections
- [ ] Advanced filtering options
- [ ] Recipe sharing functionality
- [ ] Nutritional information
- [ ] Meal prep planning
- [ ] Grocery store integration
- [ ] Recipe scaling
- [ ] AI-powered recommendations

### Technical Improvements

- [ ] Progressive Web App (PWA)
- [ ] Offline functionality
- [ ] Push notifications
- [ ] Database integration
- [ ] Real-time collaboration
- [ ] Advanced analytics

## Support

For development questions or issues:

1. Check the troubleshooting section
2. Review the code comments
3. Check browser console for errors
4. Create an issue in the repository

---

**Happy coding! 🍪**
