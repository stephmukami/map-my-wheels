import React from 'react';

function Footer() {
  return (
      <div className="bg-gray-700 p-4 text-center text-sm text-white">
        Made by 
        <span className='ml-2'>
          <a
            href="https://linktr.ee/mukami_stephanie"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-blue-500"
          >
             Stephanie Mukami
          </a>
        </span>
      </div>
  );
}

export default Footer;
