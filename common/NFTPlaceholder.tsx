import React from 'react'

import { MediaOuterStyle, TokenMetadataStyle } from './CustomStyles'

export function NFTPlaceholder() {
  return (
    <TokenMetadataStyle className="w-[280px] animate-pulse">
      <MediaOuterStyle className="h-[280px]">
        {/* <div className="flex h-full w-full animate-pulse space-x-4 px-5">
          <div
            className={`radius-100 h-full w-full rounded-md bg-[#131417]`}
          ></div>
        </div> */}
      </MediaOuterStyle>
    </TokenMetadataStyle>
  )
}

// export function NFTPlaceholder() {
//   return (
//     <TokenMetadata className="animate-pulse">
//       <div id="media-outer">
//         {/* <div className="flex h-full w-full animate-pulse space-x-4 px-5">
//           <div
//             className={`radius-100 h-full w-full rounded-md bg-[#131417]`}
//           ></div>
//         </div> */}
//       </div>
//     </TokenMetadata>
//   )
// }

// const TokenMetadata = styled.div`
//   text-align: center;
//   position: relative;
//   display: inline-block;
//   border-radius: 10px;
//   width: 280px;
//   background-color: ${Colors.tokenBackground};
//   // padding: 15px 0px;
//   z-index: 0;
//   #ellipsis {
//     color: ${Colors.white};
//     z-index: 1;
//     top: 6px;
//     right: 10px;
//     position: absolute;
//     font-size: 20px;
//     border-radius: 50%;
//     width: 35px;
//     height: 35px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     transition: 0.2s all;
//     background: ${Colors.navBg};
//     &:hover {
//       background: ${Colors.background};
//     }
//   }
//   #disabled-ellipsis {
//     color: ${Colors.lightGray};
//     z-index: 1;
//     top: 6px;
//     right: 10px;
//     position: absolute;
//     font-size: 20px;
//     border-radius: 50%;
//     width: 35px;
//     height: 35px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     transition: 0.2s all;
//     // background: rgba(100, 100, 100);
//     background: ${Colors.background};
//   }
//   .qr-code {
//     color: white;
//     z-index: 5;
//     top: 6px;
//     right: 10px;
//     position: absolute;
//     font-size: 15px;
//     border-radius: 50%;
//     width: 35px;
//     height: 35px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     transition: 0.2s all;
//     // background: rgba(100, 100, 100);
//     background: ${Colors.navBg};
//     &:hover {
//       // background: rgba(120, 120, 120);
//       background: ${Colors.background};
//     }
//   }
//   .unissue {
//     color: white;
//     z-index: 5;
//     top: 5px;
//     right: 5px;
//     position: absolute;
//     font-size: 18px;
//     border-radius: 50%;
//     width: 35px;
//     height: 35px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     transition: 0.2s all;
//     // background: rgba(100, 100, 100);
//     background: ${Colors.navBg};
//     &:hover {
//       // background: rgba(120, 120, 120);
//       background: ${Colors.background};
//     }
//   }
//   #header {
//     background: rgba(0, 0, 0, 0.4);
//     z-index: 1;
//     padding: 12px;
//     position: absolute;
//     top: -50px;
//     width: 100%;
//     transition: 0.2s all;
//   }
//   &:hover {
//     cursor: pointer;
//     #header {
//       top: 0;
//     }
//   }
//   #name {
//     font-size: 14px;
//   }
//   #media-outer {
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     height: 280px;
//     max-width: 100%;
//     #media {
//       object-fit: contain;
//       // max-width: 250px;
//       border-radius: 10px;
//       height: 100%;
//       --poster-color: transparent;
//     }
//   }
// `
